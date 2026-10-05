import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { collectionByKey, collections, isRecordActive, makeId, productCategories, productSubcategoriesFor, productTypesFor, sitePhotographySettings, type CmsRecord, type CollectionDefinition } from './schema';
import { getSession, loadCatalogue, signIn, signOut, writeRecord } from './client';
import { loadPreviewData, resetPreviewData, savePreviewData, type PreviewData } from './storage';

type StatusFilter = 'all' | 'active' | 'inactive' | 'archived';

const groupLabels = { store: 'Store', content: 'Site content' } as const;
const previewMode = import.meta.env.DEV;
const publicCollections = collections;

function emptyCatalogue(): PreviewData {
  return Object.fromEntries(publicCollections.map(({ key }) => [key, []]));
}

function displayValue(value: CmsRecord[string], field: string) {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Active' : 'Inactive';
  if (field === 'is_visible' || field === 'is_active') return String(value).toLowerCase() === 'false' ? 'Hidden' : 'Visible';
  if (field === 'image_url') return 'Image linked';
  if (field === 'video_url') return 'Video linked';
  if ((field === 'order_amount' || field === 'commission') && Number.isFinite(Number(value))) return `₦${Number(value).toLocaleString('en-NG')}`;
  return String(value);
}

function App() {
  const [data, setData] = useState<PreviewData>(() => previewMode ? loadPreviewData() : emptyCatalogue());
  const [currentKey, setCurrentKey] = useState('overview');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState<CmsRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [authReady, setAuthReady] = useState(previewMode);
  const [authenticated, setAuthenticated] = useState(previewMode);
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [dataBusy, setDataBusy] = useState(!previewMode);

  const current = collectionByKey(currentKey);
  const refreshCatalogue = async () => {
    const fresh = await loadCatalogue();
    const allowed = Object.fromEntries(publicCollections.map(({ key }) => [key, Array.isArray(fresh[key]) ? fresh[key] : []]));
    setData(allowed);
    return allowed;
  };
  const persist = (next: PreviewData) => {
    setData(next);
    if (previewMode) savePreviewData(next);
  };
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };
  const reportError = (error: unknown) => {
    notify(error instanceof Error ? error.message : 'The change could not be completed.');
  };

  useEffect(() => {
    if (previewMode) return;
    let mounted = true;
    getSession()
      .then(async ({ authenticated: hasSession }) => {
        if (!mounted) return;
        setAuthenticated(hasSession);
        if (hasSession) await refreshCatalogue();
      })
      .catch((error: unknown) => {
        if (mounted) setAuthError(error instanceof Error ? error.message : 'CMS sign-in is unavailable.');
      })
      .finally(() => {
        if (mounted) {
          setAuthReady(true);
          setDataBusy(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  const navigateTo = (key: string) => {
    setCurrentKey(key);
    setSearch('');
    setStatus('all');
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.sidebar .nav-item')?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!editing) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEditing(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [editing]);

  const filteredRecords = useMemo(() => {
    if (!current) return [];
    const records = data[current.key] ?? [];
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      if (status === 'archived' && !record.archived) return false;
      if (status !== 'archived' && record.archived) return false;
      if (status === 'active' && (!current.activeField || !isRecordActive(record, current))) return false;
      if (status === 'inactive' && (!current.activeField || isRecordActive(record, current))) return false;
      if (!query) return true;
      return current.searchableFields.some((field) => String(record[field] ?? '').toLowerCase().includes(query));
    });
  }, [current, data, search, status]);

  const openCreate = () => {
    if (!current) return;
    const initial = Object.fromEntries(current.fields.map((field) => [
      field.key,
      field.type === 'toggle' ? field.key === current.activeField : field.type === 'select' ? field.options?.[0] ?? '' : '',
    ])) as CmsRecord;
    setEditing({ ...initial, id: makeId() });
    setIsCreating(true);
  };

  const saveRecord = async (record: CmsRecord) => {
    if (!current) return;
    const next = { ...data };
    const rows = [...(next[current.key] ?? [])];
    const index = rows.findIndex((row) => row.id === record.id);
    if (previewMode) {
      const saved = { ...record, updatedAt: new Date().toISOString() };
      if (index >= 0) rows[index] = saved;
      else rows.unshift(saved);
      next[current.key] = rows;
      persist(next);
    } else {
      const result = await writeRecord(current.key, index >= 0 ? 'update' : 'create', record);
      const saved = result.record ?? { ...record, updatedAt: new Date().toISOString() };
      if (index >= 0) rows[index] = saved;
      else rows.unshift(saved);
      next[current.key] = rows;
      setData(next);
    }
    setEditing(null);
    setIsCreating(false);
    notify(`${current.singular} ${isCreating ? 'added' : 'saved'}${previewMode ? ' in this local preview' : ' to shared public content'}`);
  };

  const saveSiteMediaSetting = async (key: string, value: string) => {
    const next = { ...data };
    const settings = [...(next.settings ?? [])];
    const index = settings.findIndex((record) => String(record.key) === key);
    const record: CmsRecord = index >= 0
      ? { ...settings[index], value, updatedAt: new Date().toISOString() }
      : { id: makeId(), key, value, updatedAt: new Date().toISOString() };
    if (index >= 0) settings[index] = record;
    else settings.unshift(record);
    next.settings = settings;
    if (previewMode) persist(next);
    else {
      const result = await writeRecord('settings', index >= 0 ? 'update' : 'create', record);
      if (index >= 0) settings[index] = result.record ?? record;
      else settings.unshift(result.record ?? record);
      next.settings = settings;
      setData(next);
    }
    notify(`Site image setting saved${previewMode ? ' in this local preview' : ' to shared public content'}`);
  };

  const toggleActive = async (record: CmsRecord) => {
    if (!current?.activeField) return;
    const next = { ...record, [current.activeField]: !isRecordActive(record, current) };
    try {
      if (previewMode) {
        const rows = (data[current.key] ?? []).map((row) => row.id === record.id ? next : row);
        persist({ ...data, [current.key]: rows });
        notify(`${current.singular} status changed in this local preview`);
      } else {
        const result = await writeRecord(current.key, 'update', next);
        const saved = result.record ?? next;
        setData({ ...data, [current.key]: (data[current.key] ?? []).map((row) => row.id === record.id ? saved : row) });
        notify(`${current.singular} status changed in shared public content`);
      }
    } catch (error) {
      reportError(error);
    }
  };

  const removeRecord = async (record: CmsRecord) => {
    if (!current) return;
    const preserveProduct = current.key === 'products';
    const action = preserveProduct ? 'Hide' : 'Delete permanently';
    const detail = preserveProduct ? 'The product will be hidden from the connected catalogue and can be reactivated later.' : 'This cannot be undone.';
    if (!window.confirm(`${action} this ${current.singular}? ${detail}`)) return;
    if (!previewMode) {
      try {
        if (preserveProduct) {
          const result = await writeRecord('products', 'archive', { ...record, is_visible: false });
          const saved = result.record ?? { ...record, is_visible: false };
          setData({ ...data, products: (data.products ?? []).map((row) => row.id === record.id ? saved : row) });
        } else {
          await writeRecord(current.key, 'delete', record);
          await refreshCatalogue();
        }
        notify(`${current.singular} ${preserveProduct ? 'hidden from the catalogue' : 'deleted from shared public content'}`);
      } catch (error) {
        reportError(error);
      }
      return;
    }
    const rows = data[current.key] ?? [];
    const next = preserveProduct
      ? { ...data, [current.key]: rows.map((row) => row.id === record.id ? { ...row, archived: true, updatedAt: new Date().toISOString() } : row) }
      : { ...data, [current.key]: rows.filter((row) => row.id !== record.id) };
    persist(next);
    notify(`${current.singular} ${preserveProduct ? 'archived' : 'deleted'} in this local preview`);
  };

  const unarchiveRecord = async (record: CmsRecord) => {
    if (!current) return;
    if (!previewMode) {
      try {
        const result = await writeRecord(current.key, 'update', { ...record, archived: false, is_visible: true });
        const saved = result.record ?? { ...record, archived: false, is_visible: true };
        setData({ ...data, [current.key]: (data[current.key] ?? []).map((row) => row.id === record.id ? saved : row) });
        notify(`${current.singular} restored to shared public content`);
      } catch (error) {
        reportError(error);
      }
      return;
    }
    const next = { ...data, [current.key]: (data[current.key] ?? []).map((row) => row.id === record.id ? { ...row, archived: false, updatedAt: new Date().toISOString() } : row) };
    persist(next);
    notify(`${current.singular} restored in this local preview`);
  };

  const handleReset = () => {
    if (!previewMode) return;
    if (!window.confirm('Reset this browser preview to its sample data? This will discard preview edits.')) return;
    const fresh = resetPreviewData();
    setData(fresh);
    setCurrentKey('overview');
    setSearch('');
    setStatus('all');
    notify('Preview reset to sample data');
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      await signIn(loginPassword);
      setLoginPassword('');
      setAuthenticated(true);
      await refreshCatalogue();
    } catch (error) {
      setAuthenticated(false);
      setAuthError(error instanceof Error ? error.message : 'CMS sign-in failed.');
    } finally {
      setAuthBusy(false);
      setAuthReady(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setAuthenticated(false);
      setData(emptyCatalogue());
      setCurrentKey('overview');
      setAuthError('');
    } catch (error) {
      reportError(error);
    }
  };

  const handleRefresh = () => {
    if (previewMode) {
      setData(loadPreviewData());
      notify('Sample preview refreshed');
      return;
    }
    refreshCatalogue().then(() => notify('Shared content refreshed')).catch(reportError);
  };

  if (!authReady) return <AuthScreen loading />;
  if (!authenticated) {
    return <AuthScreen
      loading={false}
      error={authError}
      password={loginPassword}
      busy={authBusy}
      onPasswordChange={setLoginPassword}
      onSubmit={handleLogin}
    />;
  }
  if (dataBusy) return <AuthScreen loading />;

  return (
    <div className="cms-app">
      {mobileMenuOpen && <button className="mobile-nav-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar${mobileMenuOpen ? ' is-open' : ''}`} id="cms-navigation" aria-label="CMS sections">
        <div className="sidebar-brand-row">
          <a className="brand" href="#overview" onClick={() => navigateTo('overview')}>
            <span className="brand-mark">VF</span>
            <span className="brand-copy"><strong>Gifts by VF</strong><small>Owner workspace</small></span>
          </a>
          <button className="brand-close" type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>
        <button className={`nav-item overview-link ${currentKey === 'overview' ? 'selected' : ''}`} onClick={() => navigateTo('overview')}>
          <span className="nav-icon">⌂</span><span>Overview</span>
        </button>
        {(['store', 'content'] as const).map((group) => (
          <div className="nav-group" key={group}>
            <p className="nav-group-title">{groupLabels[group]}</p>
            {publicCollections.filter((item) => item.group === group).map((item) => (
              <button key={item.key} className={`nav-item ${currentKey === item.key ? 'selected' : ''}`} aria-current={currentKey === item.key ? 'page' : undefined} onClick={() => navigateTo(item.key)}>
                <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
                <span className="nav-count">{data[item.key]?.filter((record) => !record.archived).length ?? 0}</span>
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-bottom">
          <div className="owner-avatar">VF</div>
          <div className="owner-label"><strong>Owner</strong><small>{previewMode ? 'Local preview' : 'Connected workspace'}</small></div>
          {!previewMode && <button className="text-button" type="button" onClick={handleLogout}>Sign out</button>}
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-leading">
            <button ref={mobileMenuButtonRef} className="mobile-menu-toggle" type="button" aria-label="Open CMS navigation" aria-expanded={mobileMenuOpen} aria-controls="cms-navigation" onClick={() => setMobileMenuOpen(true)}><span aria-hidden="true">☰</span></button>
            <div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>{current?.label ?? 'Overview'}</strong></div>
          </div>
          <div className="topbar-actions"><span className="preview-chip"><i /> {previewMode ? 'Local preview' : 'Connected'}</span>{previewMode ? <button className="text-button reset-button" aria-label="Reset sample data" onClick={handleReset}>Reset sample data</button> : <button className="text-button reset-button" aria-label="Refresh connected content" onClick={() => refreshCatalogue().catch(reportError)}>Refresh content</button>}</div>
        </header>

        {previewMode
          ? <section className="preview-notice" role="status"><span className="notice-icon">i</span><div><strong>Preview only — sample data stays in this browser</strong><p>This local workspace uses sample data. Do not enter real customer, rep, payout, or password data.</p></div></section>
          : <section className="preview-notice connected-notice" role="status"><span className="notice-icon">✓</span><div><strong>Connected to public catalogue content</strong><p>Changes save to the shared public content database. Sales rep and payout data are not available in this CMS.</p></div></section>}

        {current ? (
          <CollectionPage
            definition={current}
            records={filteredRecords}
            allRecords={data[current.key] ?? []}
            search={search}
            status={status}
            onSearch={setSearch}
            onStatus={setStatus}
            onCreate={openCreate}
            onEdit={(record) => { setEditing(record); setIsCreating(false); }}
            onToggle={toggleActive}
            onRemove={removeRecord}
            onRestore={unarchiveRecord}
            onSaveSiteMediaSetting={(key, value) => saveSiteMediaSetting(key, value).catch(reportError)}
            onRefresh={handleRefresh}
          />
        ) : (
          <Overview data={data} onOpen={(key) => { setCurrentKey(key); setSearch(''); setStatus('all'); }} />
        )}
      </main>

      {editing && current && <RecordDialog definition={current} record={editing} isCreating={isCreating} previewMode={previewMode} onClose={() => { setEditing(null); setIsCreating(false); }} onSave={saveRecord} />}
      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </div>
  );
}

function AuthScreen({ loading, error, password, busy, onPasswordChange, onSubmit }: {
  loading: boolean;
  error?: string;
  password?: string;
  busy?: boolean;
  onPasswordChange?: (value: string) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="brand-mark">VF</div>
        <p className="eyebrow">GIFTS BY VF</p>
        <h1>Owner catalogue workspace</h1>
        {loading
          ? <p className="page-subtitle">Checking secure CMS access…</p>
          : <>
            <p className="page-subtitle">Sign in to manage public products and site content. Rep and payout records are not available here.</p>
            <form className="auth-form" onSubmit={onSubmit}>
              <label htmlFor="owner-passphrase">Owner passphrase</label>
              <input id="owner-passphrase" type="password" autoComplete="current-password" value={password ?? ''} onChange={(event) => onPasswordChange?.(event.target.value)} required minLength={32} maxLength={1024} />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            </form>
          </>}
        <p className="auth-footnote">Access expires automatically. Changes update shared public content.</p>
      </section>
    </main>
  );
}

function Overview({ data, onOpen }: { data: PreviewData; onOpen: (key: string) => void }) {
  const products = data.products ?? [];
  const visibleProducts = products.filter((record) => !record.archived && record.is_visible !== false).length;
  const sections = [
    { key: 'products', label: 'Products', detail: 'Catalogue items', value: products.filter((record) => !record.archived).length, icon: '✳' },
    { key: 'portfolio', label: 'Portfolio', detail: 'Recent work', value: (data.portfolio ?? []).filter((record) => !record.archived).length, icon: '▧' },
    { key: 'testimonials', label: 'Testimonials', detail: 'Customer stories', value: (data.testimonials ?? []).filter((record) => !record.archived).length, icon: '❝' },
    { key: 'faqs', label: 'FAQs', detail: 'Customer questions', value: (data.faqs ?? []).filter((record) => !record.archived).length, icon: '?' },
  ];
  return (
    <div className="page-content">
      <div className="page-heading"><div><p className="eyebrow">YOUR STORE, AT A GLANCE</p><h1>Good morning</h1><p className="page-subtitle">Manage the content that makes Gifts by VF yours.</p></div><button className="button button-primary" onClick={() => onOpen('products')}><span>＋</span> View products</button></div>
      <div className="summary-strip"><div className="summary-copy"><span className="summary-kicker">CATALOGUE STATUS</span><strong>{visibleProducts} <span>visible products</span></strong></div><div className="summary-divider" /><div className="summary-copy"><span className="summary-kicker">CONTENT SECTIONS</span><strong>{publicCollections.length} <span>managed areas</span></strong></div><div className="summary-decoration">✦</div></div>
      <div className="section-heading"><div><h2>Workspace overview</h2><p>Jump into a section to manage its content.</p></div><span className="small-label">{previewMode ? 'SAMPLE PREVIEW' : 'PUBLIC CONTENT'}</span></div>
      <div className="overview-grid">
        {sections.map((section) => <button className="overview-card" key={section.key} onClick={() => onOpen(section.key)}><span className="card-icon">{section.icon}</span><span className="card-arrow">↗</span><strong>{section.value}</strong><b>{section.label}</b><small>{section.detail}</small></button>)}
      </div>
      <div className="overview-lower">
        <div className="panel quick-panel"><div className="panel-heading"><div><h3>Quick access</h3><p>Frequently managed sections</p></div><span className="dots">•••</span></div><div className="quick-list">{['products', 'faqs', 'settings', 'portfolio'].map((key) => { const item = collectionByKey(key)!; return <button key={key} className="quick-row" onClick={() => onOpen(key)}><span className="quick-icon">{item.icon}</span><span><strong>{item.label}</strong><small>{item.description}</small></span><span className="quick-arrow">→</span></button>; })}</div></div>
        <div className="panel workflow-panel"><div className="workflow-icon">✦</div><p className="eyebrow">{previewMode ? 'LOCAL PREVIEW' : 'PUBLIC CONTENT ONLY'}</p><h3>{previewMode ? 'Preview catalogue updates safely' : 'Manage the public catalogue'}</h3><p>{previewMode ? 'Local edits use sample data in this browser and never update the live site.' : 'Products and site content save to the shared public database. Rep onboarding and payout records remain outside this workspace.'}</p><button className="text-button" onClick={() => onOpen('settings')}>Explore site settings <span>→</span></button></div>
      </div>
    </div>
  );
}

function CollectionPage({ definition, records, allRecords, search, status, onSearch, onStatus, onCreate, onEdit, onToggle, onRemove, onRestore, onSaveSiteMediaSetting, onRefresh }: {
  definition: CollectionDefinition;
  records: CmsRecord[];
  allRecords: CmsRecord[];
  search: string;
  status: StatusFilter;
  onSearch: (value: string) => void;
  onStatus: (value: StatusFilter) => void;
  onCreate: () => void;
  onEdit: (record: CmsRecord) => void;
  onToggle: (record: CmsRecord) => void;
  onRemove: (record: CmsRecord) => void;
  onRestore: (record: CmsRecord) => void;
  onSaveSiteMediaSetting: (key: string, value: string) => void;
  onRefresh: () => void;
}) {
  const mediaSettingKeys = definition.key === 'settings' ? new Set(sitePhotographySettings.map((setting) => setting.key)) : null;
  const displayRecords = mediaSettingKeys ? records.filter((record) => !mediaSettingKeys.has(String(record.key))) : records;
  const displayAllRecords = mediaSettingKeys ? allRecords.filter((record) => !mediaSettingKeys.has(String(record.key))) : allRecords;
  const activeCount = definition.activeField ? displayAllRecords.filter((record) => !record.archived && isRecordActive(record, definition)).length : 0;
  const inactiveCount = definition.activeField ? displayAllRecords.filter((record) => !record.archived && !isRecordActive(record, definition)).length : 0;
  const archivedCount = displayAllRecords.filter((record) => record.archived).length;
  const titleField = definition.tableFields.find((field) => ['name', 'title', 'caption', 'question', 'rep_id', 'key'].includes(field)) ?? definition.tableFields[0];
  const renderActions = (record: CmsRecord) => <div className="row-actions">{!record.archived && definition.activeField && <button className="action-link" onClick={() => onToggle(record)}>{isRecordActive(record, definition) ? 'Deactivate' : 'Activate'}</button>}<button className="action-link" onClick={() => onEdit(record)}>Edit</button>{record.archived ? <button className="action-link" onClick={() => onRestore(record)}>Restore</button> : <button className="action-link danger-link" onClick={() => onRemove(record)}>{definition.key === 'products' ? 'Archive' : 'Delete'}</button>}</div>;
  return (
    <div className="page-content">
      <div className="page-heading collection-heading"><div><p className="eyebrow">{groupLabels[definition.group].toUpperCase()}</p><h1>{definition.label}</h1><p className="page-subtitle">{definition.description}</p></div><button className="button button-primary" onClick={onCreate}><span>＋</span> Add {definition.singular}</button></div>
      {definition.key === 'settings' && <SitePhotographyPanel records={allRecords} onSave={onSaveSiteMediaSetting} />}
      <div className="collection-stats"><div><strong>{displayAllRecords.filter((record) => !record.archived).length}</strong><span>Total records</span></div><div><strong>{activeCount}</strong><span>Active</span></div><div><strong>{inactiveCount}</strong><span>Inactive</span></div><div><strong>{archivedCount}</strong><span>Archived</span></div></div>
      <div className="panel data-panel">
        <div className="data-toolbar"><label className="search-box"><span>⌕</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={`Search ${definition.label.toLowerCase()}…`} /></label><div className="toolbar-actions"><label className="filter-label" htmlFor="status-filter">Show</label><select id="status-filter" className="filter-select" value={status} onChange={(event) => onStatus(event.target.value as StatusFilter)}><option value="all">All records</option>{definition.activeField && <><option value="active">Active</option><option value="inactive">Inactive</option></>}<option value="archived">Archived</option></select><button className="icon-button" aria-label="Refresh content" title="Refresh content" onClick={onRefresh}>↻</button></div></div>
        <div className="table-scroll desktop-record-table"><table className="records-table"><thead><tr>{definition.tableFields.map((field) => <th key={field}>{definition.fields.find((item) => item.key === field)?.label ?? field}</th>)}<th>Status</th><th className="actions-heading">Actions</th></tr></thead><tbody>
          {displayRecords.map((record) => <tr key={record.id} className={record.archived ? 'archived-row' : ''}>{definition.tableFields.map((field) => <td key={field} data-label={definition.fields.find((item) => item.key === field)?.label ?? field} className={field === titleField ? 'primary-cell' : ''}>{displayValue(record[field], field)}</td>)}<td data-label="Status"><StatusBadge record={record} definition={definition} /></td><td data-label="Actions" className="actions-column">{renderActions(record)}</td></tr>)}
          {displayRecords.length === 0 && <tr className="empty-row"><td colSpan={definition.tableFields.length + 2}><div className="empty-state"><span>⌕</span><strong>No matching records</strong><p>Try another search or change the status filter.</p></div></td></tr>}
        </tbody></table></div>
        <div className="mobile-record-list" aria-label={`${definition.label} records`}>
          {displayRecords.map((record) => <article className={`mobile-record-card${record.archived ? ' archived-row' : ''}`} key={`mobile-${record.id}`}>
            <div className="mobile-record-header"><div><span className="mobile-record-kicker">{definition.singular}</span><h3>{displayValue(record[titleField], titleField)}</h3></div><StatusBadge record={record} definition={definition} /></div>
            <dl>{definition.tableFields.filter((field) => field !== titleField).map((field) => <div key={field}><dt>{definition.fields.find((item) => item.key === field)?.label ?? field}</dt><dd>{displayValue(record[field], field)}</dd></div>)}</dl>
            <div className="mobile-record-actions">{renderActions(record)}</div>
          </article>)}
          {displayRecords.length === 0 && <div className="empty-state mobile-empty-state"><span>⌕</span><strong>No matching records</strong><p>Try another search or change the status filter.</p></div>}
        </div>
        <div className="table-footer"><span>Showing {displayRecords.length} of {displayAllRecords.length} records in this local preview</span><span className="footer-note">Changes do not update the live site</span></div>
      </div>
    </div>
  );
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function driveImagePreviewUrl(value: string) {
  const driveId = value.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
    || value.match(/[?&]id=([A-Za-z0-9_-]{10,})/i)?.[1];
  return driveId ? `https://lh3.googleusercontent.com/d/${driveId}` : value;
}

function SitePhotographyPanel({ records, onSave }: { records: CmsRecord[]; onSave: (key: string, value: string) => void }) {
  const storedValues = Object.fromEntries(sitePhotographySettings.map((setting) => [
    setting.key,
    String(records.find((record) => record.key === setting.key)?.value ?? ''),
  ]));
  const [drafts, setDrafts] = useState<Record<string, string>>(storedValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDrafts(storedValues);
    setErrors({});
  }, [records]);

  const save = (key: string) => {
    const value = String(drafts[key] ?? '').trim();
    if (value && !isHttpUrl(value)) {
      setErrors((previous) => ({ ...previous, [key]: 'Enter a complete http:// or https:// image link.' }));
      return;
    }
    setErrors((previous) => ({ ...previous, [key]: '' }));
    onSave(key, value);
  };

  return (
    <section className="site-photography-panel" aria-labelledby="site-photography-title">
      <div className="site-photography-heading">
        <div><p className="eyebrow">SITE-WIDE VISUALS</p><h2 id="site-photography-title">Catalogue photography</h2><p>Paste links to images already hosted online. Nothing is uploaded or stored here.</p></div>
        <span className="media-link-chip">LINKS ONLY</span>
      </div>
      <div className="site-photography-grid">
        {sitePhotographySettings.map((setting) => {
          const value = String(drafts[setting.key] ?? '');
          const valid = !value.trim() || isHttpUrl(value.trim());
          const preview = value.trim() && isHttpUrl(value.trim()) ? driveImagePreviewUrl(value.trim()) : '';
          const hasBrokenPreview = Boolean(broken[setting.key]);
          return (
            <article className={`site-media-card${setting.key === 'hero_image_url' ? ' hero-media-card' : ''}`} key={setting.key}>
              <div className={`site-media-preview${!preview || hasBrokenPreview ? ' is-empty' : ''}`}>
                {preview && !hasBrokenPreview ? <img src={preview} alt={`${setting.label} preview`} onError={() => setBroken((previous) => ({ ...previous, [setting.key]: true }))} /> : <span>Image preview</span>}
              </div>
              <div className="site-media-fields">
                <label htmlFor={`media-${setting.key}`}><strong>{setting.label}</strong><small>{setting.description}</small></label>
                <input id={`media-${setting.key}`} type="url" inputMode="url" autoComplete="url" placeholder="https://…" value={value} aria-invalid={Boolean(errors[setting.key]) || !valid} onChange={(event) => { setDrafts((previous) => ({ ...previous, [setting.key]: event.target.value })); setBroken((previous) => ({ ...previous, [setting.key]: false })); setErrors((previous) => ({ ...previous, [setting.key]: '' })); }} />
                {errors[setting.key] && <span className="site-media-error" role="alert">{errors[setting.key]}</span>}
                {preview && !hasBrokenPreview && <a className="site-media-open-link" href={value} target="_blank" rel="noopener noreferrer">Open original link ↗</a>}
                {hasBrokenPreview && <span className="site-media-error">This link did not load an image preview.</span>}
                <div className="site-media-actions"><button className="button button-primary" type="button" disabled={!valid} onClick={() => save(setting.key)}>Save link</button><button className="text-button" type="button" onClick={() => { setDrafts((previous) => ({ ...previous, [setting.key]: '' })); setErrors((previous) => ({ ...previous, [setting.key]: '' })); setBroken((previous) => ({ ...previous, [setting.key]: false })); }}>Clear</button></div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="site-photography-note">Product and portfolio photography stays with its own item. These settings control only the shared hero and collection-cover images.</p>
    </section>
  );
}

function StatusBadge({ record, definition }: { record: CmsRecord; definition: CollectionDefinition }) {
  if (record.archived) return <span className="status-badge archived-status"><i /> Archived</span>;
  if (definition.activeField) return <span className={`status-badge ${isRecordActive(record, definition) ? 'active-status' : 'inactive-status'}`}><i />{isRecordActive(record, definition) ? 'Active' : 'Inactive'}</span>;
  return <span className="status-badge neutral-status"><i />Current</span>;
}

function RecordDialog({ definition, record, isCreating, previewMode, onClose, onSave }: { definition: CollectionDefinition; record: CmsRecord; isCreating: boolean; previewMode: boolean; onClose: () => void; onSave: (record: CmsRecord) => Promise<void> }) {
  const dialogRef = useRef<HTMLElement>(null);
  const [draft, setDraft] = useState<CmsRecord>(record);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const firstField = dialogRef.current?.querySelector<HTMLElement>('input:not([type="checkbox"]), textarea, select, button');
    firstField?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
  const category = String(draft.category ?? '');
  const subcategory = String(draft.subcategory ?? '');
  const productSubcategories = definition.key === 'products' ? productSubcategoriesFor(category) : [];
  const productTypes = definition.key === 'products' ? productTypesFor(category, subcategory) : [];
  const setField = (key: string, value: string | number | boolean) => setDraft((previous) => {
    const next = { ...previous, [key]: value };
    if (definition.key === 'products' && key === 'category') {
      next.subcategory = '';
      next.product_type = '';
    } else if (definition.key === 'products' && key === 'subcategory') {
      next.product_type = '';
    }
    return next;
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    for (const field of definition.fields) {
      const value = draft[field.key];
      const fieldRequired = field.key === 'subcategory' && definition.key === 'products'
        ? productSubcategories.length > 0
        : field.required;
      if (fieldRequired && (value == null || String(value).trim() === '')) {
        setError(`${field.label} is required.`);
        return;
      }
      if (field.type === 'url' && value && !/^https?:\/\//i.test(String(value))) {
        setError(`${field.label} must start with http:// or https://.`);
        return;
      }
      if (field.key === 'rating' && value && (Number(value) < 1 || Number(value) > 5)) {
        setError('Rating must be between 1 and 5.');
        return;
      }
    }
    setError('');
    setSaving(true);
    try {
      await onSave(draft);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The record could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="record-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-header"><div><p className="eyebrow">{isCreating ? 'NEW RECORD' : 'EDIT RECORD'}</p><h2 id="dialog-title">{isCreating ? `Add ${definition.singular}` : `Edit ${definition.singular}`}</h2></div><button className="close-button" onClick={onClose} aria-label="Close dialog">×</button></div>
        <p className="dialog-intro">{previewMode ? 'This is a local-only preview. Saved changes stay in this browser.' : 'Saved changes update the shared public database and connected storefront.'}</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            {definition.fields.map((field) => {
              if (definition.key === 'products' && field.key === 'subcategory' && productSubcategories.length === 0) return null;
              const productSelect = definition.key === 'products' && ['category', 'subcategory', 'product_type'].includes(field.key);
              const options = productSelect
                ? field.key === 'category' ? productCategories.map((item) => item.name)
                  : field.key === 'subcategory' ? productSubcategories.map((item) => item.name)
                    : productTypes
                : field.options ?? [];
              const selectHint = field.key === 'category' && definition.key === 'products'
                ? 'Choose a main catalogue category.'
                : field.key === 'subcategory' && definition.key === 'products'
                  ? 'Choose the product group.'
                  : field.key === 'product_type' && definition.key === 'products'
                  ? 'Choose a type, or use “And More...” for a custom item.'
                    : field.hint;
              const fieldRequired = field.key === 'subcategory' && definition.key === 'products'
                ? productSubcategories.length > 0
                : field.required;
              const selectDisabled = productSelect && field.key === 'product_type' && options.length === 0;
              return <label key={field.key} className={`form-field ${field.type === 'textarea' ? 'span-two' : ''} ${field.type === 'toggle' ? 'toggle-field' : ''}`}>
              {field.type === 'toggle' ? <><span><strong>{field.label}</strong>{field.hint && <small>{field.hint}</small>}</span><input type="checkbox" checked={Boolean(draft[field.key])} onChange={(event) => setField(field.key, event.target.checked)} /></> : <>
                <span className="field-label">{field.label}{fieldRequired && <em> *</em>}</span>
                {field.type === 'textarea' ? <textarea rows={3} value={String(draft[field.key] ?? '')} onChange={(event) => setField(field.key, event.target.value)} required={fieldRequired} /> : field.type === 'select' ? <select value={String(draft[field.key] ?? '')} onChange={(event) => setField(field.key, event.target.value)} required={fieldRequired} disabled={selectDisabled}>
                  {productSelect && <option value="">{field.key === 'category' ? 'Select a category…' : field.key === 'subcategory' ? 'Select a group…' : category ? 'Select a product type…' : 'Select a category first…'}</option>}
                  {options.map((option) => <option key={option} value={option}>{field.key === 'category' && definition.key === 'products' ? productCategories.find((item) => item.name === option)?.label : option}</option>)}
                </select> : <input type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'} value={String(draft[field.key] ?? '')} onChange={(event) => setField(field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)} required={fieldRequired} />}
                {selectHint && <small className="field-hint">{selectHint}</small>}
                {field.type === 'url' && /^https?:\/\//i.test(String(draft[field.key] ?? '')) && <a className="url-preview" href={String(draft[field.key])} target="_blank" rel="noopener noreferrer">Open link preview ↗</a>}
              </>}
            </label>;
            })}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-footer"><button type="button" className="button button-quiet" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : isCreating ? previewMode ? 'Add to preview' : 'Add to catalogue' : 'Save changes'}</button></div>
        </form>
      </section>
    </div>
  );
}

export default App;
