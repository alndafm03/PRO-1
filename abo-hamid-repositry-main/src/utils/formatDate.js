export const formatDate = (date) => {
  if (!date) return '-'

  const parsedDate = new Date(date)

  if (isNaN(parsedDate.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(parsedDate)
}