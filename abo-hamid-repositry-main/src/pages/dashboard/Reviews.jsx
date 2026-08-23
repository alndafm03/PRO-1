import React, { useState, useEffect } from 'react'
import TableCom from '../../components/TableCom'
import SearchAndAddCom from '../../components/ui/SearchAndAddCom'
import { useOutletContext } from 'react-router-dom'
import api from '../../api/axios'

const Reviews = () => {
  const [reviewsArr, setReviewsArr] = useState([])
  const [searchText, setsearchText] = useState('')
  const { menu, setMenu } = useOutletContext()

  useEffect(() => {
    api.get('/reviews')
      .then(res => setReviewsArr(res.data))
      .catch(err => console.log(err))
  }, [])

  const filteredReviews = searchText
    ? reviewsArr.filter(r => r.review_id?.toString().startsWith(searchText))
    : reviewsArr

  return (
    <div className='flex flex-col justify-start items-start h-screen'>
      <header className='flex justify-between items-center w-full p-4'>
        <SearchAndAddCom
          setsearchText={setsearchText}
          fields={[]}
          onAdd={null}
        />
      </header>

      <main className='w-full rounded-2xl overflow-y-auto mr-5 h-[450px] shadow-lg shadow-[#566e58]'>
        {/* {filteredReviews.length === 0
          ? <p className='text-center p-10'>there is NO Results</p>: */}
           <TableCom
              infoArr={filteredReviews}

hideMode={false}

              onDelete={async (id) => {
                try {
                  await api.delete(`/admin/reviews/${id}`)
                  setReviewsArr(prev => prev.filter(r => r.Review_id !== id))
                } catch(err) { console.log(err) }
              }}
              onEdit={null}
              setmenu={setMenu}
              menu={menu}
              idKey='review_id'
            />
        {/* } */}
      </main>
    </div>
  )
}

export default Reviews