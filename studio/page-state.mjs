export function getPagePublicationState(record) {
  const active = record?.publishing?.published !== false;

  return {
    active,
    action: active ? 'deactivate' : 'reactivate',
    buttonLabel: active ? 'Deactivate page' : 'Reactivate page',
    statusLabel: active ? 'ACTIVE' : 'INACTIVE',
  };
}

export function setPagePublished(record, active) {
  if (!record || record.template === 'homepage' || typeof active !== 'boolean') {
    return false;
  }

  if (!record.publishing || typeof record.publishing !== 'object') {
    record.publishing = {};
  }

  record.publishing.published = active;
  return true;
}
