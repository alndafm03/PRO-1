import api from './axios'


// ======================================================
// AUTHOR UPGRADE REQUESTS
// ======================================================

export const getAuthorRequests = (
  params = {}
) =>
  api.get(
    '/employee/content/author-requests',
    {
      params
    }
  )


export const preApproveAuthorRequest =
  requestId =>
    api.post(
      `/employee/content/author-requests/${requestId}/pre-approve`
    )


export const rejectAuthorRequest =
  requestId =>
    api.post(
      `/employee/content/author-requests/${requestId}/reject`
    )


export const requestAuthorChanges =
  requestId =>
    api.post(
      `/employee/content/author-requests/${requestId}/request-changes`
    )


// ======================================================
// BOOK REVIEW
// ======================================================

export const getPendingBooks = (
  params = {}
) =>
  api.get(
    '/employee/content/books/pending',
    {
      params
    }
  )


export const startBookReview =
  bookId =>
    api.post(
      `/employee/content/books/${bookId}/start-review`
    )


export const approveBook =
  bookId =>
    api.post(
      `/employee/content/books/${bookId}/approve`
    )


export const rejectBook = (
  bookId,
  rejectionReason = ''
) => {

  const value =
    String(
      rejectionReason || ''
    ).trim()


  return api.post(
    `/employee/content/books/${bookId}/reject`,
    value
      ? {
          rejection_reason:
            value
        }
      : {}
  )

}


export const requestBookChanges = (
  bookId,
  notes = ''
) => {

  const value =
    String(
      notes || ''
    ).trim()


  return api.post(
    `/employee/content/books/${bookId}/request-changes`,
    value
      ? {
          notes: value
        }
      : {}
  )

}


// ======================================================
// PUBLISHED BOOK MODIFICATION REQUESTS
// ======================================================

export const getModificationRequests = (
  params = {}
) =>
  api.get(
    '/employee/content/modification-requests',
    {
      params
    }
  )


export const approveModification =
  requestId =>
    api.post(
      `/employee/content/modification-requests/${requestId}/approve`
    )


export const rejectModification =
  requestId =>
    api.post(
      `/employee/content/modification-requests/${requestId}/reject`
    )
