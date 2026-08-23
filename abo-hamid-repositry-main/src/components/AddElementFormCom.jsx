import React from 'react'
import { useLocation } from 'react-router-dom'

const AddElementFormCom = ({
  fields,
  setshowModalAdd,
  setFormData,
  formData,
  errors,
  setErrors,
  onAdd
}) => {

  const location = useLocation()

  const titles = {
    '/': 'Admin Dashboard',
    '/books': 'Book',
    '/users': 'User',
    '/employees': 'Employee',
    '/offers': 'Offer',
    '/reports': 'Report',
    '/chats': 'Chat',
    '/reviews': 'Review',
    '/categories': 'Category',
    '/authors': 'Author',
    '/operation': 'Operation',
    '/fines': 'Fine',
    '/settings': 'Setting',
    '/employee/payments': 'Pending Payments',
    '/employee/orders': 'Order Items Ready',
    '/employee/borrowings': 'Borrowings & Returns',
    '/employee/copies': 'Book Copies',
    '/employee/fines': 'Fines',
    '/employee/seats': 'Seats & Reservations',
    '/employee/categories': 'Categories',
    '/employee/walk-in': 'Walk-in Operations',
    '/employee/manual-books': 'Add Manual Book',
    '/content-employee/books-pending': 'Books Pending Review',
    '/content-employee/author-requests': 'Author Requests',
    '/content-employee/modifications': 'Modification Requests'
  }


  // ==========================================
  // تحويل اسم الحقل إلى اسم مناسب للمستخدم
  // ==========================================

  const formatFieldName = (name) => {

    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())

  }


  // ==========================================
  // إغلاق الفورم
  // ==========================================

  const closeForm = () => {

    setshowModalAdd(false)
    setErrors({})
    setFormData({})

  }


  // ==========================================
  // SAVE
  // ==========================================

  const check = async () => {

    // ========================================
    // FRONTEND VALIDATION
    // ========================================

    const newErrors = {}

    fields.forEach(field => {

      const value = formData[field.name]

      if (
        value === undefined ||
        value === null ||
        value === ''
      ) {

        newErrors[field.name] =
          `${field.label || formatFieldName(field.name)} is required`

      }

    })


    // إذا يوجد أخطاء frontend
    if (Object.keys(newErrors).length > 0) {

      setErrors(newErrors)

      return

    }


    // إزالة الأخطاء القديمة قبل الطلب

    setErrors({})


    // ========================================
    // SEND REQUEST
    // ========================================

    try {

      await onAdd(formData)


      // ======================================
      // SUCCESS
      // ======================================

      setFormData({})
      setErrors({})
      setshowModalAdd(false)

    }

    catch (err) {

      console.log('ADD ERROR:', err)


      const responseData = err.response?.data


      // ======================================
      // LARAVEL VALIDATION ERRORS - 422
      // ======================================

      if (responseData?.errors) {

        const backendErrors = {}


        Object.entries(responseData.errors).forEach(
          ([field, messages]) => {

            backendErrors[field] =
              Array.isArray(messages)
                ? messages.join(', ')
                : messages

          }
        )


        setErrors({
          ...backendErrors,

          general: responseData.message || ''
        })


        return
      }


      // ======================================
      // LARAVEL MESSAGE
      // ======================================

      if (responseData?.message) {

        setErrors({
          general: responseData.message
        })

        return
      }


      // ======================================
      // NETWORK / UNKNOWN ERROR
      // ======================================

      setErrors({
        general:
          err.message ||
          'Something went wrong. Please try again.'
      })

    }

  }


  return (

    <div
      className='fixed inset-0 z-50
      bg-black/50 p-2
      flex items-center justify-center'
      
      onClick={closeForm}
    >

      <div
        className='bg-[#A6B37D]
        shadow-lg shadow-[#6c754b]
        rounded-2xl
        p-6
        w-100
        max-h-[90vh]
        overflow-y-auto
        flex flex-col
        gap-4
        items-center'

        onClick={(e) => e.stopPropagation()}
      >


        {/* ==================================
            TITLE
        ================================== */}

        <h2 className='font-bold text-xl'>

          ADD {titles[location.pathname] || ''}

        </h2>


        {/* ==================================
            GENERAL ERROR
        ================================== */}

        {errors.general && (

          <div
            className='w-80
            bg-red-200
            border border-red-400
            text-red-700
            p-3
            rounded-xl
            text-center
            text-sm
            font-semibold'
          >

            {errors.general}

          </div>

        )}


        {/* ==================================
            FIELDS
        ================================== */}

        {fields.map(field => {

          const fieldLabel =
            field.label ||
            formatFieldName(field.name)


          return (

            <div
              key={field.name}
              className='w-80'
            >


              {/* LABEL */}

              <label
                className='block
                text-sm
                font-bold
                text-[#122F21]
                mb-1
                capitalize'
              >

                {fieldLabel}

              </label>


              {/* ==================================
                  SELECT
              ================================== */}

              {field.type === 'select' ? (

                <select

                  value={
                    formData[field.name] ?? ''
                  }

                  onChange={(e) => {

                    setFormData({
                      ...formData,
                      [field.name]: e.target.value
                    })


                    // حذف خطأ هذا الحقل فقط

                    setErrors(prev => {

                      const newErrors = {
                        ...prev
                      }

                      delete newErrors[field.name]

                      return newErrors

                    })

                  }}

                  className='bg-[#AAC3AD]
                  shadow-lg
                  p-2
                  w-80
                  text-center
                  text-[#122F21]
                  rounded-2xl
                  outline-none'
                >

                  <option value=''>
                    Choose {fieldLabel}
                  </option>


                  {field.options?.map(opt => (

                    <option
                      key={opt}
                      value={opt}
                    >
                      {opt}
                    </option>

                  ))}

                </select>

              ) : (

                /* ==================================
                   INPUT
                ================================== */

                <input

                  type={field.type}

                  value={
                    formData[field.name] ?? ''
                  }

                  placeholder={
                    field.type === 'date'
                      ? 'Select date'
                      : field.placeholder ||
                        `Enter ${fieldLabel}`
                  }

                  onChange={(e) => {

                    setFormData({
                      ...formData,
                      [field.name]: e.target.value
                    })


                    // حذف خطأ هذا الحقل فقط

                    setErrors(prev => {

                      const newErrors = {
                        ...prev
                      }

                      delete newErrors[field.name]

                      return newErrors

                    })

                  }}

                  className='bg-[#AAC3AD]
                  shadow-lg
                  p-2
                  w-80
                  text-center
                  text-[#122F21]
                  rounded-2xl
                  outline-none'

                />

              )}


              {/* ==================================
                  FIELD ERROR
              ================================== */}

              {errors[field.name] && (

                <p
                  className='text-red-600
                  text-sm
                  mt-1
                  font-semibold'
                >

                  {errors[field.name]}

                </p>

              )}

            </div>

          )

        })}


        {/* ==================================
            BUTTONS
        ================================== */}

        <div className='flex gap-4 w-80 mt-2'>


          {/* SAVE */}

          <button
            onClick={check}

            className='bg-[#F09A79]
            rounded-2xl
            p-2
            w-full
            shadow-lg
            text-[#122F21]
            cursor-pointer
            active:scale-95'
          >

            Save

          </button>


          {/* CLOSE */}

          <button

            onClick={closeForm}

            className='bg-[#F09A79]
            rounded-2xl
            p-2
            w-full
            shadow-lg
            text-[#122F21]
            cursor-pointer
            active:scale-95'
          >

            Close

          </button>


        </div>

      </div>

    </div>
  )
}


export default AddElementFormCom