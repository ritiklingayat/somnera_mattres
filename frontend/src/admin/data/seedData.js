export const moduleConfig = {
  reviews: {
    title: 'Customer Reviews',
    subtitle: 'Feedback & Ratings',
    action: 'Add Review',
    emptyTitle: 'No reviews recorded yet',
    emptyDescription: 'Customer reviews submitted on products will appear here.',
    fields: [
      { name: 'author', label: 'Reviewer Name', type: 'text' },
      { name: 'rating', label: 'Rating (1-5)', type: 'number' },
      { name: 'title', label: 'Review Title', type: 'text' },
      { name: 'content', label: 'Review Comment', type: 'textarea' },
    ],
  },
  settings: {
    title: 'Store Settings',
    subtitle: 'Preferences & Policies',
    action: 'Save Configuration',
    emptyTitle: 'Store Configuration',
    emptyDescription: 'General store preferences, brand information, and policies.',
    fields: [
      { name: 'storeName', label: 'Store Name', type: 'text' },
      { name: 'supportEmail', label: 'Support Email', type: 'email' },
      { name: 'supportPhone', label: 'Support Phone', type: 'text' },
      { name: 'address', label: 'Headquarters Address', type: 'textarea' },
    ],
  },
};
