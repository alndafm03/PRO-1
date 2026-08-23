import React, { useState, useEffect } from 'react'
import TableCom from '../../components/TableCom'
import SearchAndAddCom from '../../components/ui/SearchAndAddCom'
import EditeFormCom from '../../components/ui/EditeFormCom'
import { useOutletContext } from 'react-router-dom'
import api from '../../api/axios'

const Categories = () => {
  const [categoriesArr, setCategoriesArr] = useState([])
  const [editCategory, setEditCategory] = useState(null)
  const [searchText, setsearchText] = useState('')
  const { menu, setMenu } = useOutletContext()

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategoriesArr(res.data.data))
      .catch(err => console.log(err))
  }, [])


  const handleEdit = async () => {
    try {
      await api.put(`/employee/library/categories/${editCategory.category_id}`, editCategory)
      setCategoriesArr(prev => prev.map(c => c.category_id === editCategory.category_id ? editCategory : c))
      setEditCategory(null)
      setMenu(null)
    } catch(err) { console.log(err) }
  }

  const filteredCategories = searchText
    ? categoriesArr.filter(c => c.name?.toString().startsWith(searchText))
    : categoriesArr

  return (
    <div className='flex flex-col justify-start items-start h-screen'>
      <header className='flex justify-between items-center w-full p-4'>
        <SearchAndAddCom
          setsearchText={setsearchText}
          fields={[
            { name: 'name', type: 'text' },
            { name: 'status', type: 'select', options: ['active', 'disabled'] }
          ]}

          canAdd={true}
          onAdd={async (newItem) => {
            try {
              const res = await api.post('/employee/library/categories/', newItem)
              setCategoriesArr(prev => [...prev, res.data.data])
            } catch(err) { console.log(err) }
          }}
            searchPlaceholder='search by  name'
        />
      </header>

      <main className='w-full rounded-2xl overflow-y-auto mr-5 h-[450px] shadow-lg shadow-[#566e58]'>
        {editCategory && (
          <EditeFormCom
            editItem={editCategory}
            setEditItem={setEditCategory}
            onSave={handleEdit}
            onClose={() => { setEditCategory(null); setMenu(null) }}
            selectFields={{ status: ['active', 'disabled'] }}
          />
        )}

        {/* {filteredCategories.length === 0
          ? <p className='text-center p-10'>لا يوجد نتائج</p>
          :  */}
          <TableCom
              infoArr={filteredCategories}

              hideMode={false}

              onDelete={async (id) => {
                try {
                  await api.delete(`/categories/${id}`)
                  setCategoriesArr(prev => prev.filter(c => c.category_id !== id))
                } catch(err) { console.log(err) }
              }}
              onEdit={(category) => setEditCategory(category)}
              setmenu={setMenu}
              menu={menu}
              
              canToggle={true}

          onToggle={async (category) => {
  try {
    await api.post(`/employee/library/categories/${category.category_id}/toggle`)
    setCategoriesArr(prev => prev.map(c =>
      c.category_id === category.category_id
        ? { ...c, is_active: !c.is_active }
        : c
    ))
  } catch(err) { console.log(err) }
}}

              canEdit={true}
              idKey='category_id'

            />
        {/* } */}
      </main>
    </div>
  )
}

export default Categories