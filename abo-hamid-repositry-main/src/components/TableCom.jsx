// import React from 'react'
// import { Delete, Edit } from 'lucide-react'
// import { formatDate } from '../utils/formatDate'

// const TableCom = ({
//   infoArr,
//   canToggle,
//   onToggle,
//   hideMode,
//   setmenu,
//   menu,
//   onDelete,
//   onEdit,
//   canEdit,
//   idKey
// }) => {

//   if (!infoArr || infoArr.length === 0) {
//     return (
//       <p className='flex text-4xl justify-center items-center h-[450px]
//       bg-[#AAC3AD] text-[#122F21] rounded-2xl w-full m-auto'>
//         There Is No Results
//       </p>
//     )
//   }


//   const displayValue = (value, key) => {

//     // null / undefined
//     if (value === null || value === undefined) {
//       return '-'
//     }


//     // DATE
//     if (
//       key === 'birthday' ||
//       key === 'created_at' ||
//       key === 'updated_at' ||
//       key === 'deleted_at' ||
//       key === 'last_login_at'
//     ) {
//       return formatDate(value)
//     }


//     // ROLES
//     if (key === 'roles' && Array.isArray(value)) {
//       return value
//         .map(role => role.name)
//         .join(', ')
//     }


//     // ARRAYS
//     if (Array.isArray(value)) {
//       return value
//         .map(item =>
//           typeof item === 'object'
//             ? item.name || item.id || JSON.stringify(item)
//             : item
//         )
//         .join(', ')
//     }


//     // OBJECTS
//     if (typeof value === 'object') {
//       return JSON.stringify(value)
//     }


//     // BOOLEAN
//     if (typeof value === 'boolean') {
//       return value ? 'Yes' : 'No'
//     }


//     return String(value)
//   }


//   return (

//     <table className='bg-[#AAC3AD] text-[#122F21]
//     rounded-2xl w-full m-auto p-2 pr-4'>

//       <thead className='sticky top-0 z-10 bg-[#AAC3AD]'>

//         <tr className='p-4 border-b-2 border-l-1 border-r-1 border-[#F6EFC5]'>

//           {Object.keys(infoArr[0]).map((key) => (

//             <th
//               key={key}
//               className='p-5 rounded-2xl border-l-1
//               border-r-1 border-[#F6EFC5]'
//             >
//               {key}
//             </th>

//           ))}

//         </tr>

//       </thead>


//       <tbody>

//         {infoArr.map((info, index) => (

//           <tr
//             key={info[idKey] ?? index}

//             onClick={(e) => {
//               e.stopPropagation()

//               setmenu?.({
//                 x: e.clientX,
//                 y: e.clientY,
//                 index
//               })
//             }}

//             className={`
//               p-4 border-[#566e58] cursor-pointer
//               transition-colors

//               ${
//                 menu?.index === index
//                   ? 'bg-[#F09A79]'
//                   : menu
//                     ? ''
//                     : 'hover:bg-[#F09A79]'
//               }
//             `}
//           >

//             {Object.keys(infoArr[0]).map((key) => (

//               <td
//                 key={key}
//                 className='pl-6 pb-4 p-4 text-start
//                 rounded-2xl border-1 border-[#F6EFC5]'
//               >

//                 {displayValue(info[key], key)}

//               </td>

//             ))}


//             {menu && menu.index === index && (

//               <td>

//                 <div
//                   className='fixed z-[100] bg-[#F09A79]
//                   shadow-md shadow-[#b3684b]
//                   rounded-xl p-2 flex flex-col gap-2'

//                   style={{
//                     top: menu.y,
//                     left: menu.x
//                   }}
//                 >

//                   {canEdit && (

//                     <button
//                       className='cursor-pointer
//                       active:opacity-80 active:scale-85
//                       hover:scale-94 text-[#122F21]'

//                       onClick={(e) => {
//                         e.stopPropagation()
//                         onEdit(info)
//                       }}
//                     >
//                       Edit
//                       <Edit />
//                     </button>

//                   )}


//                   {canToggle && (

//                     <button
//                       className='cursor-pointer
//                       active:opacity-80 active:scale-85
//                       hover:scale-94 text-[#122F21]'

//                       onClick={(e) => {
//                         e.stopPropagation()
//                         onToggle(info)
//                       }}
//                     >
//                       {info.status === 'active'
//                         ? 'Disable'
//                         : 'Enable'}
//                     </button>

//                   )}


//                   {hideMode ? (

//                     <button
//                       className='cursor-pointer
//                       active:opacity-80 active:scale-90
//                       hover:scale-94 text-[#122F21]'

//                       onClick={(e) => {
//                         e.stopPropagation()

//                         info.is_hidden
//                           ? onUnhide(info[idKey])
//                           : onHide(info[idKey])
//                       }}
//                     >
//                       {info.is_hidden ? 'UnHide' : 'hide'}
//                     </button>

//                   ) : (

//                     <button
//                       className='cursor-pointer
//                       active:opacity-80 active:scale-90
//                       hover:scale-94 text-[#122F21]'

//                       onClick={(e) => {
//                         e.stopPropagation()

//                         onDelete(info[idKey])
//                         setmenu(null)
//                       }}
//                     >
//                       Delete
//                       <Delete />
//                     </button>

//                   )}

//                 </div>

//               </td>

//             )}

//           </tr>

//         ))}

//       </tbody>

//     </table>
//   )
// }

// export default TableCom
// import React from 'react'
// import { Delete, Edit } from 'lucide-react'


// // =====================================
// // FORMAT DATE
// // =====================================

// const formatDate = (value) => {

//   if (!value) return '-'

//   const date = new Date(value)

//   if (isNaN(date.getTime())) {
//     return value
//   }

//   return date.toLocaleDateString('en-GB', {
//     year: 'numeric',
//     month: 'short',
//     day: '2-digit'
//   })
// }


// // =====================================
// // RENDER VALUE
// // =====================================

// const renderValue = (value, key) => {

//   // null / undefined

//   if (value === null || value === undefined) {
//     return '-'
//   }


//   // boolean

//   if (typeof value === 'boolean') {
//     return value ? 'Yes' : 'No'
//   }


//   // Array

//   if (Array.isArray(value)) {

//     // Array of objects
//     if (
//       value.length > 0 &&
//       typeof value[0] === 'object'
//     ) {

//       return value
//         .map(item => {

//           if (item?.title) {
//             return item.title
//           }

//           if (item?.name) {
//             return item.name
//           }

//           if (item?.id) {
//             return `ID: ${item.id}`
//           }

//           return JSON.stringify(item)

//         })
//         .join(', ')
//     }

//     // Array of primitive values

//     return value.join(', ')
//   }


//   // Object

//   if (typeof value === 'object') {

//     return Object.entries(value)
//       .map(([k, v]) => `${k}: ${v}`)
//       .join(' | ')
//   }


//   // Date fields

//   if (
//     typeof value === 'string' &&
//     (
//       key?.includes('date') ||
//       key?.includes('_at')
//     )
//   ) {

//     return formatDate(value)
//   }


//   // normal value

//   return value
// }


// const TableCom = ({
//   infoArr,
//   canToggle,
//   onToggle,
//   hideMode,
//   setmenu,
//   menu,
//   onDelete,
//   onEdit,
//   canEdit,
//   idKey
// }) => {


//   // =====================================
//   // SAFETY CHECK
//   // =====================================

//   if (!Array.isArray(infoArr) || infoArr.length === 0) {

//     return (
//       <p className='flex text-4xl justify-center items-center h-[450px]
//       bg-[#AAC3AD] text-[#122F21] rounded-2xl w-full m-auto'>

//         There Is No Results

//       </p>
//     )
//   }


//   // =====================================
//   // GET COLUMNS
//   // =====================================

//   const firstValidItem = infoArr.find(
//     item =>
//       item !== null &&
//       typeof item === 'object'
//   )


//   if (!firstValidItem) {

//     return (
//       <p className='flex text-4xl justify-center items-center h-[450px]
//       bg-[#AAC3AD] text-[#122F21] rounded-2xl w-full m-auto'>

//         There Is No Results

//       </p>
//     )
//   }


//   const columns = Object.keys(firstValidItem)


//   return (

//     <table className='bg-[#AAC3AD] text-[#122F21]
//     rounded-2xl w-full m-auto p-2 pr-4'>


//       {/* ================= HEADER ================= */}

//       <thead className='sticky top-0 z-10 bg-[#AAC3AD]'>

//         <tr className='p-4 border-b-2 border-[#F6EFC5]'>

//           {columns.map(key => (

//             <th
//               key={key}
//               className='p-5 rounded-2xl border-l border-r border-[#F6EFC5]'
//             >

//               {key}

//             </th>

//           ))}

//         </tr>

//       </thead>


//       {/* ================= BODY ================= */}

//       <tbody>

//         {infoArr.map((info, index) => {

//           if (!info || typeof info !== 'object') {
//             return null
//           }


//           return (

//             <tr

//               key={info[idKey] ?? index}

//               onClick={(e) => {

//                 e.stopPropagation()

//                 setmenu({
//                   x: e.clientX,
//                   y: e.clientY,
//                   index
//                 })

//               }}

//               className={`p-4 border-[#566e58] cursor-pointer transition-colors

//               ${
//                 menu?.index === index
//                   ? 'bg-[#F09A79]'
//                   : menu
//                     ? ''
//                     : 'hover:bg-[#F09A79]'
//               }`}

//             >


//               {/* ================= CELLS ================= */}

//               {columns.map(key => (

//                 <td

//                   key={key}

//                   className='pl-6 pb-4 p-4 text-start
//                   rounded-2xl border border-[#F6EFC5]'

//                 >

//                   {renderValue(info[key], key)}

//                 </td>

//               ))}


//               {/* ================= MENU ================= */}

//               {menu?.index === index && (

//                 <div

//                   className='fixed bg-[#F09A79]
//                   shadow-md shadow-[#b3684b]
//                   rounded-xl p-2 flex flex-col gap-2'

//                   style={{
//                     top: menu.y,
//                     left: menu.x
//                   }}

//                 >


//                   {/* EDIT */}

//                   {canEdit && (

//                     <button

//                       className='cursor-pointer
//                       active:opacity-80
//                       active:scale-85
//                       hover:scale-94
//                       text-[#122F21]
//                       flex items-center gap-2'

//                       onClick={(e) => {

//                         e.stopPropagation()

//                         onEdit(info)

//                       }}

//                     >

//                       Edit

//                       <Edit />

//                     </button>

//                   )}


//                   {/* TOGGLE */}

//                   {canToggle && (

//                     <button

//                       className='cursor-pointer
//                       active:opacity-80
//                       active:scale-85
//                       hover:scale-94
//                       text-[#122F21]'

//                       onClick={(e) => {

//                         e.stopPropagation()

//                         onToggle(info)

//                       }}

//                     >

//                       {info.status === 'active'
//                         ? 'Disable'
//                         : 'Enable'
//                       }

//                     </button>

//                   )}


//                   {/* DELETE */}

//                   {!hideMode && (

//                     <button

//                       className='cursor-pointer
//                       active:opacity-80
//                       active:scale-90
//                       hover:scale-94
//                       text-[#122F21]
//                       flex items-center gap-2'

//                       onClick={(e) => {

//                         e.stopPropagation()

//                         onDelete(info[idKey])

//                         setmenu(null)

//                       }}

//                     >

//                       Delete

//                       <Delete />

//                     </button>

//                   )}

//                 </div>

//               )}

//             </tr>

//           )

//         })}

//       </tbody>

//     </table>

//   )
// }


// export default TableCom

import React from 'react'
import { Delete, Edit, RefreshCcw, RefreshCw, RefreshCwIcon } from 'lucide-react'


// =====================================
// FORMAT DATE
// =====================================

const formatDate = (value) => {

  if (!value) return '-'

  const date = new Date(value)

  if (isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}


// =====================================
// FORMAT COLUMN NAME
// =====================================

const formatColumnName = (key) => {

  const specialNames = {
    id: 'ID',
    user_id: 'User ID',
    book_id: 'Book ID',
    author_id: 'Author ID',
    offer_id: 'Offer ID',
    created_at: 'Created At',
    updated_at: 'Updated At',
    deleted_at: 'Deleted At',
    last_login_at: 'Last Login At',
    is_hidden: 'Hidden',
    discount_percent: 'Discount Percent'
  }

  if (specialNames[key]) {
    return specialNames[key]
  }

  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}


// =====================================
// RENDER VALUE
// =====================================

const renderValue = (value, key) => {

  // null / undefined
  if (value === null || value === undefined) {
    return '-'
  }


  // DATE
  if (
    typeof value === 'string' &&
    (
      key === 'birthday' ||
      key?.includes('date') ||
      key?.includes('_at')
    )
  ) {
    return formatDate(value)
  }


  // BOOLEAN
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }


  // ARRAY
  if (Array.isArray(value)) {

    if (value.length === 0) {
      return '-'
    }

    // Array of objects
    if (
      typeof value[0] === 'object' &&
      value[0] !== null
    ) {

      return value
        .map(item => {

          if (item?.title) {
            return item.title
          }

          if (item?.name) {
            return item.name
          }

          if (item?.id) {
            return `ID: ${item.id}`
          }

          return JSON.stringify(item)

        })
        .join(', ')
    }

    // Array of primitive values
    return value.join(', ')
  }


  // OBJECT
  if (typeof value === 'object') {

    return Object.entries(value)
      .map(([k, v]) => `${formatColumnName(k)}: ${v}`)
      .join(' | ')
  }


  // NORMAL VALUE
  return String(value)
}


// =====================================
// TABLE
// =====================================

const TableCom = ({
  infoArr,
  canToggle,
  onToggle,
  hideMode,
  setmenu,
  menu,
  onDelete,
  onEdit,
  canEdit,
  idKey,
  onHide,
  onUnhide
}) => {


  // =====================================
  // SAFETY
  // =====================================

  if (!Array.isArray(infoArr) || infoArr.length === 0) {

    return (
      <p className='flex text-2xl justify-center items-center h-[450px]
      bg-[#AAC3AD] text-[#122F21] rounded-2xl w-full m-auto'>

        There Is No Results

      </p>
    )
  }


  const firstValidItem = infoArr.find(
    item =>
      item !== null &&
      typeof item === 'object'
  )


  if (!firstValidItem) {

    return (
      <p className='flex text-2xl justify-center items-center h-[450px]
      bg-[#AAC3AD] text-[#122F21] rounded-2xl w-full m-auto'>

        There Is No Results

      </p>
    )
  }


  // =====================================
  // DYNAMIC COLUMNS
  // =====================================

  const columns = Object.keys(firstValidItem)


  return (

    <table
      className='bg-[#AAC3AD] text-[#122F21]
      rounded-2xl w-full m-auto'
    >

      {/* HEADER */}

      <thead className='sticky top-0 z-10 bg-[#AAC3AD]'>

        <tr className='border-b-2 border-[#F6EFC5]'>

          {columns.map(key => (

            <th
              key={key}
              className='px-3 py-2 text-sm font-bold
              whitespace-nowrap border-l border-r
              border-[#F6EFC5]'
            >

              {formatColumnName(key)}

            </th>

          ))}

        </tr>

      </thead>


      {/* BODY */}

      <tbody>

        {infoArr.map((info, index) => {

          if (!info || typeof info !== 'object') {
            return null
          }


          return (

            <tr
              key={info[idKey] ?? index}

              onClick={(e) => {

                e.stopPropagation()

                setmenu?.({
                  x: e.clientX,
                  y: e.clientY,
                  index
                })

              }}

              className={`
                border-[#566e58]
                cursor-pointer
                transition-colors
                text-sm

                ${
                  menu?.index === index
                    ? 'bg-[#F09A79]'
                    : 'hover:bg-[#F09A79]'
                }
              `}
            >


              {/* CELLS */}

              {columns.map(key => (

                <td
                  key={key}
                  className='px-3 py-2 text-sm text-start
                  border border-[#F6EFC5]'
                >

                  {renderValue(info[key], key)}

                </td>

              ))}


              {/* MENU */}

              {menu?.index === index && (

                <td className='p-0'>

                  <div
                    className='fixed z-[100]
                    bg-[#F09A79]
                    shadow-md shadow-[#b3684b]
                    rounded-xl p-2
                    flex flex-col gap-1'

                    style={{
                      top: menu.y,
                      left: menu.x
                    }}
                  >

                    {/* EDIT */}

                    {canEdit && (

                      <button
                        className='cursor-pointer
                        active:opacity-80
                        active:scale-90
                        hover:scale-95
                        text-[#122F21]
                        flex items-center gap-2
                        px-2 py-1'

                        onClick={(e) => {

                          e.stopPropagation()

                          onEdit?.(info)

                          setmenu?.(null)

                        }}
                      >

                        Edit

                        <Edit size={16} />

                      </button>

                    )}


                    {/* TOGGLE */}

                    {canToggle && (

                      <button
                        className='cursor-pointer
                        active:opacity-80
                        active:scale-90
                        hover:scale-95
                        text-[#122F21]
                        px-2 py-1'

                        onClick={(e) => {

                          e.stopPropagation()

                          onToggle?.(info)

                          setmenu?.(null)

                        }}
                      >

                        {info.status === 'active'
                          ? 'Disable'
                          : 'Enable'
                        }
                        <RefreshCcw size={18}/>

                      </button>

                    )}


                    {/* HIDE / UNHIDE */}

                    {hideMode && (

                      <button
                        className='cursor-pointer
                        active:opacity-80
                        active:scale-90
                        hover:scale-95
                        text-[#122F21]
                        px-2 py-1'

                        onClick={(e) => {

                          e.stopPropagation()

                          if (info.is_hidden) {
                            onUnhide?.(info[idKey])
                          } else {
                            onHide?.(info[idKey])
                          }

                          setmenu?.(null)

                        }}
                      >

                        {info.is_hidden
                          ? 'Unhide'
                          : 'Hide'
                        }
                        <RefreshCwIcon size={18}/>

                      </button>

                    )}


                    {/* DELETE */}

                    {!hideMode && (

                      <button
                        className='cursor-pointer
                        active:opacity-80
                        active:scale-90
                        hover:scale-95
                        text-[#122F21]
                        flex items-center gap-2
                        px-2 py-1'

                        onClick={(e) => {

                          e.stopPropagation()

                          onDelete?.(info[idKey])

                          setmenu?.(null)

                        }}
                      >

                        Delete

                        <Delete size={16} />

                      </button>

                    )}

                  </div>

                </td>

              )}

            </tr>

          )

        })}

      </tbody>

    </table>

  )
}


export default TableCom