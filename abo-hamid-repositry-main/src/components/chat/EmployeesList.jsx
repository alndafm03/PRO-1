import React, { useState } from 'react'

const EmployeesList = () => {

const [employeesArr, setemployeesArray] = useState([
  {
employeeId:0,
employeeType:'adventure',
pages:500,
state:'available',

  },
  {
    employeeId:'01',
    employeeType:'adventure',
    pages:500,
    state:'available',
    
        },
  {
    
employeeId:1,
employeeType:'romantic',
pages:400,
state:'available',

  },
  {

    employeeId:2,
    employeeType:'police',
    pages:350,
    state:'nonAvailable',
  },
  {

    employeeId:3,
    employeeType:'adventure',
    pages:600,
    state:'available',

  }
,
  {

    employeeId:4,
    employeeType:'adventure',
    pages:600,
    state:'available',
    
  }
,

{

employeeId:5,
employeeType:'adventure',
pages:600,
state:'available',

},
{

employeeId:6,
employeeType:'adventure',
pages:600,
state:'available',

},{

employeeId:7,
employeeType:'adventure',
pages:600,
state:'available',

},{

employeeId:8,
employeeType:'adventure',
pages:600,
state:'available',

}]);

  return (
    <div className='flex flex-col gap-2  m-auto bg-[#A6B37D] rounded-2xl w-65 overflow-auto h-135 shadow-lg shadow-[#7c865b] '> 
{employeesArr.map((info,index)=>(
    <div key={index} className=' bg-[#AAC3AD] gap-2 m-2 p-2 text-[#122F21] rounded-2xl' >{info.employeeId}</div>
)

)}

    </div>
  )
}

export default EmployeesList
