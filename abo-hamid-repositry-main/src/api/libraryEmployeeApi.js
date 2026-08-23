// import api from './axios';

// export const getPendingPayments = () => api.get('/employee/library/payments/pending');
// export const approvePayment = (paymentId) => api.post(`/employee/library/payments/${paymentId}/approve`);
// export const rejectPayment = (paymentId, reason) => api.post(`/employee/library/payments/${paymentId}/reject`, { reason });

// export const markOrderItemReady = (orderItemId) => api.post(`/employee/library/order-items/${orderItemId}/mark-ready`);

// export const getBorrowings = () => api.get('/employee/library/borrowings');
// export const registerReturn = (borrowingId, payload) => api.post(`/employee/library/borrowings/${borrowingId}/return`, payload);

// export const getBookCopies = (bookId) => api.get(`/employee/library/books/${bookId}/copies`);
// export const addBookCopy = (bookId, payload) => api.post(`/employee/library/books/${bookId}/copies`, payload);
// export const updateBookCopy = (copyId, payload) => api.put(`/employee/library/copies/${copyId}`, payload);

// export const searchBooksPublic = (query = '') => api.get('/search', { params: query ? { search: query } : {} });///

// export const getFines = () => api.get('/employee/library/fines');
// export const markFinePaid = (borrowingId) => api.post(`/employee/library/fines/${borrowingId}/mark-paid`);

// export const getSeats = () => api.get('/employee/library/seats');
// export const addSeat = (payload) => api.post('/employee/library/seats', payload);
// export const deleteSeat = (seatId) => api.delete(`/employee/library/seats/${seatId}`);
// export const getReservations = () => api.get('/employee/library/reservations');

// export const addCategory = (payload) => api.post('/employee/library/categories', payload);
// export const updateCategory = (categoryId, payload) => api.put(`/employee/library/categories/${categoryId}`, payload);
// export const toggleCategory = (categoryId) => api.post(`/employee/library/categories/${categoryId}/toggle`);
// export const getCategoriesPublic = () => api.get('/categories');

// export const createWalkInPurchase = (payload) => api.post('/employee/library/walk-in/purchases', payload);
// export const createWalkInBorrowing = (payload) => api.post('/employee/library/walk-in/borrowings', payload);
// export const createWalkInReservation = (payload) => api.post('/employee/library/walk-in/reservations', payload);
// export const getWalkInStats = () => api.get('/employee/library/walk-in/stats');

// export const createManualBook = (payload) => api.post('/employee/library/manual-books', payload);





















// import api from './axios'

// // =========================
// // Payments
// // =========================

// export const getPendingPayments = () =>
//   api.get('/employee/library/payments/pending')

// export const approvePayment = (paymentId) =>
//   api.post(`/employee/library/payments/${paymentId}/approve`)

// export const rejectPayment = (paymentId, reason) =>
//   api.post(
//     `/employee/library/payments/${paymentId}/reject`,
//     { reason }
//   )


// // =========================
// // Orders
// // =========================

// export const markOrderItemReady = (orderItemId) =>
//   api.post(
//     `/employee/library/order-items/${orderItemId}/mark-ready`
//   )


// // =========================
// // Borrowings
// // =========================

// export const getBorrowings = () =>
//   api.get('/employee/library/borrowings')

// export const registerReturn = (borrowingId, payload) =>
//   api.post(
//     `/employee/library/borrowings/${borrowingId}/return`,
//     payload
//   )


// // =========================
// // Physical Book Copies
// // =========================

// export const getBookCopies = (bookId) =>
//   api.get(`/employee/library/books/${bookId}/copies`)

// export const addBookCopy = (bookId, payload) =>
//   api.post(
//     `/employee/library/books/${bookId}/copies`,
//     payload
//   )

// export const updateBookCopy = (copyId, payload) =>
//   api.put(
//     `/employee/library/copies/${copyId}`,
//     payload
//   )


// // =========================
// // Public Search
// // =========================

// export const searchBooksPublic = (query = '') => {
//   return api.get('/search', {
//     params: {
//       q: query.trim(),
//     },
//   })
// }


// // =========================
// // Fines
// // =========================

// export const getFines = () =>
//   api.get('/employee/library/fines')

// export const markFinePaid = (borrowingId) =>
//   api.post(
//     `/employee/library/fines/${borrowingId}/mark-paid`
//   )


// // =========================
// // Seats
// // =========================

// export const getSeats = () =>
//   api.get('/employee/library/seats')

// export const addSeat = (payload) =>
//   api.post(
//     '/employee/library/seats',
//     payload
//   )

// export const deleteSeat = (seatId) =>
//   api.delete(
//     `/employee/library/seats/${seatId}`
//   )


// // =========================
// // Reservations
// // =========================

// export const getReservations = () =>
//   api.get('/employee/library/reservations')


// // =========================
// // Categories
// // =========================

// export const addCategory = (payload) =>
//   api.post(
//     '/employee/library/categories',
//     payload
//   )

// export const updateCategory = (categoryId, payload) =>
//   api.put(
//     `/employee/library/categories/${categoryId}`,
//     payload
//   )

// export const toggleCategory = (categoryId) =>
//   api.post(
//     `/employee/library/categories/${categoryId}/toggle`
//   )

// export const getCategoriesPublic = () =>
//   api.get('/categories')


// // =========================
// // Walk-in Operations
// // =========================

// export const createWalkInPurchase = (payload) =>
//   api.post(
//     '/employee/library/walk-in/purchases',
//     payload
//   )

// export const createWalkInBorrowing = (payload) =>
//   api.post(
//     '/employee/library/walk-in/borrowings',
//     payload
//   )

// export const createWalkInReservation = (payload) =>
//   api.post(
//     '/employee/library/walk-in/reservations',
//     payload
//   )

// export const getWalkInStats = () =>
//   api.get(
//     '/employee/library/walk-in/stats'
//   )


// // =========================
// // Manual Books
// // =========================

// export const createManualBook = (payload) =>
//   api.post(
//     '/employee/library/manual-books',
//     payload
//   )




import api from './axios'
// ======================================================
// Payments
// ======================================================

export const getPendingPayments = (params = {}) =>
  api.get(
    '/employee/library/payments/pending',
    {
      params
    }
  )

export const approvePayment = paymentId =>
  api.post(
  `/employee/library/payments/${paymentId}/approve`
  )

export const rejectPayment = paymentId =>
  api.post(
   `/employee/library/payments/${paymentId}/reject`
  )

// ======================================================
// Orders
// ======================================================

export const markOrderItemReady = (orderItemId) =>
  api.post(
    `/employee/library/order-items/${orderItemId}/mark-ready`
  )

// ======================================================
// Borrowings
// ======================================================

export const getBorrowings = (params = {}) =>
  api.get(
    '/employee/library/borrowings',
    {
      params
    }
  )
// export const getBorrowings = () =>
//   api.get('/employee/library/borrowings')

export const registerReturn = (
  borrowingId,
  payload
) =>
  api.post(
    `/employee/library/borrowings/${borrowingId}/return`,
    payload
  )

// ======================================================
// Physical Book Copies
// ======================================================
export const getBookCopies = (
  bookId,
  params = {}
) =>
  api.get(
   `/employee/library/books/${bookId}/copies`,
   {
      params
    }
  )

export const addBookCopy = (
  bookId,
  payload
) =>
  api.post(
    `/employee/library/books/${bookId}/copies`,
    payload
  )

export const updateBookCopy = (
  copyId,
  payload
) =>
  api.put(
    `/employee/library/copies/${copyId}`,
    payload
  )

// ======================================================
// Public Search
// ======================================================
export const searchBooksPublic = (
  query = '',
  params = {}
) =>
  api.get(
    '/search',
    {
      params: {
        q: query.trim(),
        ...params
      }
    }
  )

// ======================================================
// Fines
// ======================================================

export const getFines = () =>
  api.get('/employee/library/fines')

export const markFinePaid = (
  borrowingId
) =>
  api.post(
    `/employee/library/fines/${borrowingId}/mark-paid`
  )

// ======================================================
// Seats
// ======================================================
export const getSeats = (
  params = {}
) =>
  api.get(
    '/employee/library/seats',
    {
      params
    }
  )

export const addSeat = (payload) =>
  api.post(
    '/employee/library/seats',
    payload
  )

export const deleteSeat = (seatId) =>
  api.delete(
    `/employee/library/seats/${seatId}`
  )


// ======================================================
// Borrowing Options
// ======================================================

export const getBorrowOptions = bookId =>
  api.get(
    `/borrowings/book/${bookId}/options`
  )



// ======================================================
// Reservations
// ======================================================
export const getReservations = (
  params = {}
) =>
  api.get(
    '/employee/library/reservations',
    {
      params
    }
  )

// ======================================================
// Categories
// ======================================================

export const addCategory = (
  payload
) =>
  api.post(
    '/employee/library/categories',
    payload
  )

export const updateCategory = (
  categoryId,
  payload
) =>
  api.put(
    `/employee/library/categories/${categoryId}`,
    payload
  )

export const toggleCategory = (
  categoryId
) =>
  api.post(
    `/employee/library/categories/${categoryId}/toggle`
  )

 

export const getCategoriesPublic = () => {
  return api.get('/categories')
}
// ======================================================
// Walk-in Operations
// ======================================================

export const createWalkInPurchase = (
  payload
) =>
  api.post(
    '/employee/library/walk-in/purchases',
    payload
  )

export const createWalkInBorrowing = (
  payload
) =>
  api.post(
    '/employee/library/walk-in/borrowings',
    payload
  )

export const createWalkInReservation = (
  payload
) =>
  api.post(
    '/employee/library/walk-in/reservations',
    payload
  )

export const getWalkInStats = () =>
  api.get(
    '/employee/library/walk-in/stats'
  )

// ======================================================
// Manual Books
// ======================================================

// ======================================================
// Manual Books
// ======================================================

export const createManualBook = formData =>
  api.post(
    '/employee/library/manual-books',
    formData
  )