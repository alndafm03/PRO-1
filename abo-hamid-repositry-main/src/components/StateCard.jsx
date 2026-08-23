import React from 'react'

const StateCard = ({infosArray}) => {
  return (
    <div className='flex  gap-6'>


    {
    
    infosArray.map((e)=>{
    const Icon= e.icon;
          return(
          
        <div key={e.id} className='flex  flex-col gap-4 mt-2 bg-[#A6B37D] p-5 rounded-2xl  text-[#122F21] shadow-lg shadow-[#7c865b]'>
          <Icon size={20}></Icon>
        <h1>
         {e.title}  
          </h1>
          {e.value}
    
    
        </div> 
      )}
    )
      
    }
      </div>    
  )
}

export default StateCard
