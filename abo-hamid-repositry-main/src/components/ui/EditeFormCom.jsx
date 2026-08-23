import React from 'react'

const EditeFormCom = ({
  setEditItem,
  editItem,
  onSave,
  onClose,
  fields = []
}) => {

  if (!editItem) return null


  // تحويل اسم الحقل من:
  // discount_percent -> Discount Percent
  // starts_at -> Starts At
  const formatLabel = (name) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
  }


  return (

    <div
      className='
        fixed
        inset-0
        bg-black/50
        z-50
        flex
        items-center
        justify-center
        p-4
        overflow-y-auto
      '

      onClick={onClose}
    >

      <div
        className='
          text-[#122F21]
          bg-[#A6B37D]
          rounded-2xl
          shadow-2xl
          p-6
          w-full
          max-w-lg
          max-h-[90vh]
          flex
          flex-col
        '

        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}

        <h1 className='font-bold text-xl text-center mb-4'>
          Edit
        </h1>


        {/* FIELDS */}

        <div
          className='
            flex
            flex-col
            gap-4
            overflow-y-auto
            pr-2
            flex-1
          '
        >

          {fields.map(field => {

            const key = field.name

            return (

              <div
                key={key}
                className='flex flex-col gap-1 w-full'
              >

                <label
                  className='
                    text-sm
                    font-bold
                    text-[#122F21]
                    capitalize
                  '
                >
                  {formatLabel(key)}:
                </label>


                {/* SELECT */}

                {field.type === 'select' ? (

                  <select
                    value={editItem[key] ?? ''}

                    onChange={(e) => {

                      setEditItem({
                        ...editItem,
                        [key]: e.target.value
                      })

                    }}

                    className='
                      bg-[#AAC3AD]
                      shadow-lg
                      p-2
                      w-full
                      shadow-[#739277]
                      text-center
                      text-[#122F21]
                      rounded-2xl
                      outline-none
                    '
                  >

                    <option value=''>
                      Choose {formatLabel(key)}
                    </option>

                    {field.options?.map(option => (

                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>

                    ))}

                  </select>


                ) : (

                  /* NORMAL INPUT */

                  <input
                    type={field.type || 'text'}

                    placeholder={
                      field.placeholder ||
                      `Enter ${formatLabel(key)}`
                    }

                    value={
                      editItem[key] === null ||
                      editItem[key] === undefined
                        ? ''
                        : editItem[key]
                    }

                    onChange={(e) => {

                      setEditItem({
                        ...editItem,
                        [key]: e.target.value
                      })

                    }}

                    className='
                      bg-[#AAC3AD]
                      shadow-lg
                      p-2
                      w-full
                      shadow-[#739277]
                      text-center
                      text-[#122F21]
                      rounded-2xl
                      outline-none
                    '
                  />

                )}

              </div>

            )

          })}

        </div>


        {/* BUTTONS */}

        <div
          className='
            flex
            gap-4
            justify-center
            items-center
            pt-5
            mt-4
            border-t
            border-[#739277]
          '
        >

          <button
            className='
              cursor-pointer
              p-3
              rounded-2xl
              bg-[#F09A79]
              text-[#122F21]
              shadow-lg
              shadow-[#b46f54]
              active:scale-90
              active:opacity-80
              flex-1
            '

            onClick={onSave}
          >
            Save
          </button>


          <button
            className='
              cursor-pointer
              p-3
              rounded-2xl
              bg-[#F09A79]
              text-[#122F21]
              shadow-lg
              shadow-[#b46f54]
              active:scale-90
              active:opacity-80
              flex-1
            '

            onClick={onClose}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  )
}

export default EditeFormCom