export type FieldType = 'text' | 'textarea' | 'number' | 'url' | 'select' | 'toggle';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
}

export interface CollectionDefinition {
  key: string;
  label: string;
  singular: string;
  description: string;
  group: 'store' | 'content';
  icon: string;
  fields: FieldDefinition[];
  tableFields: string[];
  activeField?: string;
  searchableFields: string[];
}

import productTaxonomy from '../../js/product-taxonomy.json';

export interface ProductTypeDefinition {
  name: string;
  aliases?: string[];
}

export interface ProductSubcategory {
  name: string;
  productTypes: ProductTypeDefinition[];
}

export interface ProductCategory {
  name: string;
  label: string;
  description: string;
  legacyAliases: string[];
  imageSettingKey: string;
  productTypes?: ProductTypeDefinition[];
  subcategories?: ProductSubcategory[];
}

export type CmsRecord = Record<string, string | number | boolean | undefined> & {
  id: string;
  archived?: boolean;
  updatedAt?: string;
};

export const productCategories: ProductCategory[] = productTaxonomy.categories;

export const sitePhotographySettings = [
  { key: 'hero_image_url', label: 'Homepage hero image', description: 'Wide image used behind the opening headline.' },
  ...productCategories.map((category) => ({
    key: category.imageSettingKey,
    label: `${category.name} cover image`,
    description: `Photography shown on the ${category.name} collection card.`,
  })),
];

export const productCategoryNames = productCategories.map((category) => category.name);

export const productSubcategoriesFor = (categoryName: string) =>
  productCategories.find((category) => category.name === categoryName)?.subcategories ?? [];

export const productTypesFor = (categoryName: string, subcategoryName: string) => {
  const category = productCategories.find((item) => item.name === categoryName);
  if (!category) return [];
  if (category.subcategories?.length) {
    return category.subcategories.find((subcategory) => subcategory.name === subcategoryName)?.productTypes.map((product) => product.name) ?? [];
  }
  return category.productTypes?.map((product) => product.name) ?? [];
};

export const collections: CollectionDefinition[] = [
  {
    key: 'products', label: 'Products', singular: 'product', description: 'Catalogue items and their customer-facing details.', group: 'store', icon: '✳', activeField: 'is_visible',
    fields: [
      { key: 'name', label: 'Product name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'price', label: 'Price', type: 'text', hint: 'Example: ₦25,000 or From ₦25,000' },
      { key: 'category', label: 'Category', type: 'select', required: true },
      { key: 'subcategory', label: 'Product group', type: 'select', required: true },
      { key: 'product_type', label: 'Product type', type: 'select', required: true },
      { key: 'image_url', label: 'Image link', type: 'url', hint: 'Paste a public image URL. Uploads are not enabled in this preview.' },
      { key: 'video_url', label: 'Video link', type: 'url', hint: 'YouTube, Google Drive preview, or direct MP4/WebM link.' },
      { key: 'occasion', label: 'Occasions', type: 'text', hint: 'Comma-separated, e.g. Birthday, Wedding' },
      { key: 'material', label: 'Material', type: 'text' },
      { key: 'size', label: 'Size', type: 'text' },
      { key: 'turnaround', label: 'Turnaround', type: 'text' },
      { key: 'delivery_notes', label: 'Delivery notes', type: 'textarea' },
      { key: 'payment_terms', label: 'Payment terms', type: 'textarea' },
      { key: 'sales_caption', label: 'Sales caption', type: 'textarea' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'featured', label: 'Featured', type: 'toggle' },
      { key: 'is_visible', label: 'Visible in catalogue', type: 'toggle' },
      { key: 'in_stock', label: 'In stock', type: 'toggle' },
      { key: 'stock_label', label: 'Stock label', type: 'text' },
    ],
    tableFields: ['name', 'category', 'product_type', 'price', 'is_visible'],
    searchableFields: ['name', 'description', 'category', 'subcategory', 'product_type', 'occasion'],
  },
  {
    key: 'settings', label: 'Site settings', singular: 'setting', description: 'Brand, headings, contact details, and storefront copy.', group: 'store', icon: '⚙',
    fields: [
      { key: 'key', label: 'Setting key', type: 'text', required: true },
      { key: 'value', label: 'Value', type: 'textarea', required: true },
    ],
    tableFields: ['key', 'value'], searchableFields: ['key', 'value'],
  },
  {
    key: 'portfolio', label: 'Portfolio', singular: 'portfolio item', description: 'Finished pieces shown in the recent work gallery.', group: 'content', icon: '▧', activeField: 'is_visible',
    fields: [
      { key: 'caption', label: 'Caption', type: 'text', required: true },
      { key: 'image_url', label: 'Image link', type: 'url', required: true, hint: 'Paste a public image URL.' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'wide', label: 'Wide tile', type: 'toggle' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_visible', label: 'Visible on site', type: 'toggle' },
    ],
    tableFields: ['caption', 'category', 'display_order', 'is_visible'], searchableFields: ['caption', 'category'],
  },
  {
    key: 'testimonials', label: 'Testimonials', singular: 'testimonial', description: 'Customer quotes and ratings.', group: 'content', icon: '❝', activeField: 'is_visible',
    fields: [
      { key: 'name', label: 'Customer name', type: 'text', required: true },
      { key: 'quote', label: 'Quote', type: 'textarea', required: true },
      { key: 'source', label: 'Source', type: 'text' },
      { key: 'rating', label: 'Rating (1–5)', type: 'number', required: true },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_visible', label: 'Visible on site', type: 'toggle' },
    ],
    tableFields: ['name', 'quote', 'rating', 'is_visible'], searchableFields: ['name', 'quote', 'source'],
  },
  {
    key: 'why-us', label: 'Why us', singular: 'benefit', description: 'Reasons customers choose Gifts by VF.', group: 'content', icon: '♡', activeField: 'is_visible',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'icon', label: 'Icon', type: 'text', hint: 'Use an existing icon key such as gift, truck, or heart.' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_visible', label: 'Visible on site', type: 'toggle' },
    ],
    tableFields: ['title', 'description', 'icon', 'is_visible'], searchableFields: ['title', 'description'],
  },
  {
    key: 'how-to-order', label: 'How to order', singular: 'order step', description: 'The steps customers follow to place an order.', group: 'content', icon: '☷', activeField: 'is_visible',
    fields: [
      { key: 'title', label: 'Step title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_visible', label: 'Visible on site', type: 'toggle' },
    ],
    tableFields: ['display_order', 'title', 'description', 'is_visible'], searchableFields: ['title', 'description'],
  },
  {
    key: 'faqs', label: 'FAQs', singular: 'FAQ', description: 'Answers to common customer questions.', group: 'content', icon: '?', activeField: 'is_visible',
    fields: [
      { key: 'question', label: 'Question', type: 'text', required: true },
      { key: 'answer', label: 'Answer', type: 'textarea', required: true },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_visible', label: 'Visible on site', type: 'toggle' },
    ],
    tableFields: ['question', 'answer', 'display_order', 'is_visible'], searchableFields: ['question', 'answer'],
  },
];

export const collectionByKey = (key: string) => collections.find((item) => item.key === key);

export const isRecordActive = (record: CmsRecord, definition: CollectionDefinition) => {
  if (!definition.activeField) return true;
  return record[definition.activeField] !== false && String(record[definition.activeField]).toLowerCase() !== 'false';
};

export const makeId = () => `preview-${crypto.randomUUID()}`;
