import { createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './layout/AdminLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Books from './pages/dashboard/Books';
import Employees from './pages/dashboard/Employees';
import Offers from './pages/dashboard/Offers';
import Users from './pages/dashboard/Users';
import Reports from './pages/dashboard/Reports';
import Chat from './pages/dashboard/Chat';
import Authors from './pages/dashboard/Authors';
import Categories from './pages/dashboard/Categories';
import Reviews from './pages/dashboard/Reviews';
import Operations from './pages/dashboard/Operations';
import Fines from './pages/dashboard/Fines';
import Settings from './pages/dashboard/Settings';
import ProtectedRoute from './components/ProtectedRoute';

import EmployeeLayout from './layout/EmployeeLayout';
import PendingPayments from './pages/employee/PendingPayments';
import OrderItemsReady from './pages/employee/OrderItemsReady';
import Borrowings from './pages/employee/Borrowings';
import BookCopies from './pages/employee/BookCopies';
import EmployeeFines from './pages/employee/Fines';
import Seats from './pages/employee/Seats';
import EmployeeCategories from './pages/employee/Categories';
import WalkIn from './pages/employee/WalkIn';
import ManualBook from './pages/employee/ManualBook';
import ContentEmployeeLayout from './layout/ContentEmployeeLayout';
import BooksPending from './pages/content-employee/BooksPending';
import AuthorRequests from './pages/content-employee/AuthorRequests';
import Modifications from './pages/content-employee/Modifications';

const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path='/login' element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path='/' element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path='/books' element={<Books />} />
            <Route path='/employees' element={<Employees />} />
            <Route path='/offers' element={<Offers />} />
            <Route path='/authors' element={<Authors />} />
            {/* <Route path='/categories' element={<Categories />} /> */}
            {/* <Route path='/reviews' element={<Reviews />} /> */}
            <Route path='/users' element={<Users />} />
            <Route path='/operation' element={<Operations />} />
            <Route path='/fines' element={<Fines />} />
            {/* <Route path='/chats' element={<Chat />} /> */}
            <Route path='/reports' element={<Reports />} />
            <Route path='/settings' element={<Settings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['library_employee']} />}>
          <Route path='/employee' element={<EmployeeLayout />}>
            <Route index element={<PendingPayments />} />
            <Route path='payments' element={<PendingPayments />} />
            <Route path='orders' element={<OrderItemsReady />} />
            <Route path='borrowings' element={<Borrowings />} />
            <Route path='copies' element={<BookCopies />} />
            <Route path='fines' element={<EmployeeFines />} />
            <Route path='seats' element={<Seats />} />
            <Route path='categories' element={<EmployeeCategories />} />
            <Route path='walk-in' element={<WalkIn />} />
            <Route path='manual-books' element={<ManualBook />} />
          </Route>
        </Route>
<Route
  element={
    <ProtectedRoute
      allowedRoles={[
        'author_content_employee'
      ]}
    />
  }
>

  <Route
    path='/content-employee'
    element={
      <ContentEmployeeLayout />
    }
  >

    <Route
      index
      element={
        <Navigate
          to='books-pending'
          replace
        />
      }
    />

    <Route
      path='books-pending'
      element={
        <BooksPending />
      }
    />

    <Route
      path='author-requests'
      element={
        <AuthorRequests />
      }
    />

    <Route
      path='modifications'
      element={
        <Modifications />
      }
    />

  </Route>

</Route>


        <Route path='*' element={<Navigate to='/login' />} />
      </>
    )
  );

  return (
    <RouterProvider router={router} />
  )
}

export default App