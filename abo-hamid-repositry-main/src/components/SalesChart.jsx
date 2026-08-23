import { ChartScatter } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { XAxis ,YAxis,Line,LineChart, Legend, Tooltip, ResponsiveContainer} from 'recharts'
import api from '../api/axios'

const SalesChart = () => {
    const arraSOfyales=[{
month:'jan',sales:30},
{month:'feb',sales:40},
{
    month:'Mar',
    sales:50
    
},{
    month:'apri',
    sales:70
    
},{
    month:'may',
    sales:60
    
},{month:'june',sales:50},{month:'jul',sales:60},{   month:'aug',
    sales:60},{  month:'sept',sales:70 },{
    month:'octo',sales:80},{
    month:'nov',sales:20   },{
    month:'dec',sales:60  
},] 

const [arraySalesBooksChart, setArraySalesBooksChart] = useState([])


  useEffect(()=>{
api.get('/dashboard/arraySalesBooksChart').then(
  res=>{
    setArraySalesBooksChart(res.data)
  }
).catch(err=>console.log(err))

  },[])


  return (
  <div className='w-full  h-80'>

<ResponsiveContainer>


<h2 className=' font-bold text-xl mb-4 mt-4 ml-3 text-[#122F21] w-xl'>books sales chart</h2>
    <LineChart className=' bg-[#A6B37D] text-[#122F21] p-5 mt-5 rounded-2xl shadow-lg shadow-[#7c865b]' width='100%' height='100%' data={arraySalesBooksChart}>
           <Legend/>
           <Tooltip/>
        <XAxis dataKey='month'/> 
        <YAxis dataKey='sales'/>
        <Line dataKey='sales' />

    </LineChart>
</ResponsiveContainer>
  </div>
  )
}

export default SalesChart
