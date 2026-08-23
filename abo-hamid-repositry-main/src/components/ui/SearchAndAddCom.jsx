import { Plus, Search } from 'lucide-react'
import React, { useState } from 'react'
import AddElementFormCom from '../AddElementFormCom'

const SearchAndAddCom = ({
  setsearchText,
  fields,
  canAdd,
  onAdd,
  searchPlaceholder  
}) => {

  const [searchValue, setsearchValue] = useState('')
  const [formData, setFormData] = useState({})
  const [showModalAdd, setshowModalAdd] = useState(false)
  const [errors, setErrors] = useState({})


  return (
    <>

      <div className='flex justify-between items-center content-center w-160 h-15 gap-4
      bg-[#A6B37D] text-[#122F21] p-3 mb-4 mt-2
      rounded-2xl shadow-lg shadow-[#7c865b]'>

        <input
          type="text"
          className='bg-[#F6EFC5] rounded-2xl p-2 w-70'

          placeholder={searchPlaceholder}

          onKeyDown={(e) =>
            e.key === 'Enter' &&
            setsearchText(searchValue)
          }

          onChange={(e) =>
            setsearchValue(e.target.value)
          }
        />

        <button
          className='text-[#122F21] pr-4 cursor-pointer
          active:scale-80 active:opacity-80'

          onClick={() => {
            setsearchText(searchValue)
          }}
        >
          <Search />
        </button>

      </div>


      {canAdd && (

        <button
          className='flex flex-row gap-2 mr-5 cursor-pointer p-4
          rounded-2xl bg-[#F09A79] text-[#122F21]
          shadow-lg shadow-[#b46f54]
          active:scale-90 active:opacity-80'

          onClick={() => {
            setErrors({})
            setFormData({})
            setshowModalAdd(true)
          }}
        >
          ADD
          <Plus />
        </button>

      )}


      {showModalAdd && (

        <AddElementFormCom

          fields={fields}

          setshowModalAdd={setshowModalAdd}

          setFormData={setFormData}

          formData={formData}

          errors={errors}

          setErrors={setErrors}

          onAdd={onAdd}

        />

      )}

    </>
  )
}

export default SearchAndAddCom