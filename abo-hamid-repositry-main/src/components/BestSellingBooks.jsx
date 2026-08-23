import React, { useEffect, useState } from 'react'
import { BarChart,Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import api from '../api/axios'
const BestSellingBooks = () => {
    const arraSOfyales=[{
         book:'advinture',ConterOfSales:30
    },
        {book:'romantic',ConterOfSales:40

        },
        {
            book:'police',ConterOfSales:50
            
        },{
            book:'development',ConterOfSales:70
            
        },{
            book:'crime',ConterOfSales:60
            
        },]
     
     const [arrayBestBooksSalesChart, setArrayBestBooksSalesChart] = useState([])
     
     
       useEffect(()=>{
     api.get('/dashboard/arrayBestBooksSalesChart').then(
       res=>{
         setArrayBestBooksSalesChart(res.data)
       }
     ).catch(err=>console.log(err))
     
       },[])
  return (
    <div className='w-full h-80'>
        <ResponsiveContainer>
<h2 className=' font-bold text-xl mb-4 mt-4 ml-3 text-[#122F21] w-xl'>Best Selling Books</h2>


 
      <BarChart className=' bg-[#A6B37D] text-[#122F21] p-5 mt-5 rounded-2xl shadow-lg shadow-[#7c865b]' width='100%' height='100%' data={arrayBestBooksSalesChart}>
<Legend/>
<Tooltip/>
<XAxis dataKey='book'/>
<YAxis/>
<Bar dataKey='ConterOfSales' fill='#F09A79'/>        
      </BarChart>
      
        </ResponsiveContainer>

    </div>
  )
}

export default BestSellingBooks


