import React, { useState } from 'react'
import EmployeesList from '../../components/chat/EmployeesList'
import ChatHeader from '../../components/chat/ChatHeader'
import Messages from '../../components/chat/Messages'
import MessageInput from '../../components/chat/MessageInput'

const Chat = () => {
  const [searchText,setsearchText] = useState('');
  return (
    <div className='w-full full flex-col'>
        <ChatHeader setsearchText={setsearchText}/>
      <div className='flex flex-row w-full justify-between'> 
<div>
<EmployeesList searchText={searchText}/>
</div>

<div className='flex flex-col w-full '>
        <Messages/>
        <MessageInput/>
</div>
 
        </div>
      
    </div>
  )
}

export default Chat
