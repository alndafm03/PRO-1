import { Search } from 'lucide-react';
import React from 'react'   
import { useState } from 'react';

const ChatHeader = ({setsearchText}) => {
  const [searchValue, setsearchValue] = useState('');
  
    return (
    
      <div className='flex justify-between items-center content-center w-full h-15 gap-4 
    bg-[#A6B37D] text-[#122F21] p-3 mb-4 mt-2 
    rounded-2xl shadow-lg shadow-[#7c865b] '>

        <input type="number"  className=' bg-[#F6EFC5] rounded-2xl p-2 w-70 ' placeholder=' Search Chats'
         onKeyDown={(e)=>e.key==='Enter'&& setsearchText(searchValue)}
           onChange={(e)=>{setsearchValue(e.target.value)}}/>
        <button className='text-[#122F21] pr-4 cursor-pointer active:scale-80 active:opacity-80' onClick={()=>{
          setsearchText(searchValue)}
          } ><Search/>  </button>
</div>

    
   
  )
}

export default ChatHeader
