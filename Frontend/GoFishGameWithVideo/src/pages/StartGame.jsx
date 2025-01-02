import React, { useEffect, useState } from "react";
import '../Components/Login.css'
import { useForm } from "react-hook-form";
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from "react-router";

export const StartGame = () => {

    const [userId, setUserId] = useState("");

    const [roomId, setRoomId] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const id = localStorage.getItem('token');
        setUserId(id);
    },[]);

    const {
        register,
        handleSubmit,
    } = useForm();

    const onSubmit = async (data) => {
        const formData = { ...data, userId: userId }
        console.log(formData);
        try{
        const response = await fetch("http://localhost:3000/startGame", {  
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        console.log(result);
        if(result.success === true){
            toast.success(result.message);
            setRoomId(result.message);
        }
        else if(result.success === false){
            toast.error(result.message);
        }
    }
    catch(err){
        console.log(err);
        toast.error('Something error occured');
    }

    };
    return (
        <div id="webcrumbs">
            <div
                className="w-full h-[900px] bg-black text-primary-50 rounded-lg flex justify-center items-center"
                style={{ background: "linear-gradient(135deg, #2F2C59, #F0209B)" }}
            >
                <Toaster/>
                <div className="w-[400px] h-auto bg-[#1c1b3a] rounded-lg p-6 flex flex-col ">
                    <h1 className="font-title text-2xl mb-4">CREATE THE ROOM</h1>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="w-full space-y-3.5">
                            <div className="flex flex-col">
                                <label htmlFor="players" className="text-sm pb-1">
                                    ENTER NUMBER OF PLAYERS
                                </label>
                                <select
                                    id="players"
                                    {...register("numberOfPlayers")}
                                    className="p-2 text-center bg-[#2f2f45] text-primary-50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-900"
                                >
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                </select>
                            </div>

                            <div className="flex flex-col mt-2">
                                <label htmlFor="userId" className="text-sm pb-1">
                                    USER ID
                                </label>
                                <input
                                    type="text"
                                    id="userId"
                                    readOnly
                                    disabled
                                    {...register("userId")}
                                    defaultValue={userId}
                                    className="p-2 text-center bg-[#2f2f45] text-primary-50 rounded-md focus:outline-none"
                                />
                            </div>
                            {roomId.length===0 && (<button
                                className="w-full mt-4 p-2 rounded-md text-center text-primary-50"
                                style={{
                                    background: "linear-gradient(135deg, #C13530, #8e44ad)",
                                }}
                            >
                                CREATE THE ROOM
                            </button>)}
                            
                        </div>
                    </form>
                    {roomId.length>0 && (<div className="w-full mt-4 p-2 rounded-md text-center text-primary-50"
                                style={{
                                    background: "linear-gradient(135deg, #C13530, #8e44ad)",
                                }}
                                onClick={()=>{navigate(`/game/${roomId}`)}}
                                >
                                ROOM ID: {roomId}
                        </div>)}
                </div>
            </div>
        </div>
    )
}

