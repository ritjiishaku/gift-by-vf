import { collections, sitePhotographySettings, type CmsRecord } from './schema';

const STORAGE_KEY = 'vf-cms-preview-v2';
export type PreviewData = Record<string, CmsRecord[]>;

const seed: PreviewData = {
  products: [
    { id: 'sample-product-1', name: 'Personalised Keepsake Frame', description: 'A made-to-order sample product for previewing the catalogue editor.', category: 'Picture Enlargement', subcategory: '', product_type: 'Acrylic Frameless Picture Enlargement', price: '₦25,000', image_url: '', video_url: '', occasion: 'Birthday, Wedding', material: 'Acrylic', size: 'A4', turnaround: '5–7 days', delivery_notes: '', payment_terms: '', sales_caption: '', display_order: 1, featured: true, is_visible: true, in_stock: true, stock_label: '' },
    { id: 'sample-product-2', name: 'Engraved Gift Box', description: 'Another sample record. Replace it with connected catalogue data before launch.', category: 'More to Love', subcategory: '', product_type: 'Customized Gift Items', price: '₦18,500', image_url: '', occasion: 'Anniversary', material: 'Wood', size: '', turnaround: '3–5 days', delivery_notes: '', payment_terms: '', sales_caption: '', display_order: 2, featured: false, is_visible: true, in_stock: true, stock_label: '' },
  ],
  settings: [
    { id: 'sample-setting-1', key: 'site_title', value: 'Gifts by VF — Preview', updatedAt: new Date().toISOString() },
    { id: 'sample-setting-2', key: 'products_title', value: 'Choose the perfect gift', updatedAt: new Date().toISOString() },
    { id: 'sample-setting-3', key: 'whatsapp_number', value: '2348000000000', updatedAt: new Date().toISOString() },
    ...sitePhotographySettings.map((setting, index) => ({ id: `sample-media-setting-${index + 1}`, key: setting.key, value: '' })),
  ],
  portfolio: [{ id: 'sample-portfolio-1', caption: 'Custom anniversary frame', image_url: '', category: 'Acrylic', wide: false, display_order: 1, is_visible: true }],
  testimonials: [{ id: 'sample-testimonial-1', name: 'Sample Customer', quote: 'This is sample content shown only in the local CMS preview.', source: 'Preview', rating: 5, display_order: 1, is_visible: true }],
  'why-us': [{ id: 'sample-why-1', title: 'Made with care', description: 'Sample benefit description for the preview.', icon: 'heart', display_order: 1, is_visible: true }],
  'how-to-order': [{ id: 'sample-step-1', title: 'Choose a gift', description: 'Browse the collection and find a gift for your occasion.', display_order: 1, is_visible: true }],
  faqs: [{ id: 'sample-faq-1', question: 'How do I place an order?', answer: 'Contact Gifts by VF on WhatsApp to discuss your order.', display_order: 1, is_visible: true }],
};

export function loadPreviewData(): PreviewData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PreviewData;
      return Object.fromEntries(collections.map(({ key }) => [key, Array.isArray(parsed[key]) ? parsed[key] : seed[key] ?? []]));
    }
  } catch {
    // An unavailable or invalid local cache falls back to harmless sample data.
  }
  return structuredClone(seed);
}

export function savePreviewData(data: PreviewData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function resetPreviewData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The preview still works in memory if browser storage is unavailable.
  }
  return loadPreviewData();
}
