import { useEffect, useState } from "react";
import toast, { Toaster } from 'react-hot-toast';
import "../Components/Login.css";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";

export const JoinGame = () => {
    const {userid} = useParams();
    const [userId, setUserId] = useState("");

    const [roomId, setRoomId] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        setUserId(userid);
    }, []);

    const {
        register,
        handleSubmit,
    } = useForm();

    const onSubmit = async (data) => {
        const formData = { ...data, userId: userId }

        try {
            const response = await fetch("http://localhost:3000/joinRoom", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            console.log(result);
            if (result.success === true) {
                toast.success(result.message);
                
                navigate(`/gameroom/${data.roomId}/${userid}`);
            }
            else {
                toast.error(result.message);
            }
        }
        catch (err) {
            console.log(err);
            toast.error('Something error occured');
        }
    }

    return (
        <div id="webcrumbs">
            <div className="w-full h-[900px] bg-black text-primary-50 rounded-lg flex justify-center items-center" style={{ background: 'linear-gradient(135deg, #2F2C59, #F0209B)' }}
            >
                <Toaster/>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="w-[400px] h-auto bg-[#1c1b3a] rounded-lg p-6 flex flex-col items-center">
                        <h1 className="font-title text-2xl mb-4">JOIN THE ROOM</h1>
                        <div className="w-full space-y-3.5">
                            <div className="flex flex-col">
                                <label htmlFor="roomId" className="text-sm pb-1">
                                    ENTER ROOM ID
                                </label>
                                <input
                                    type="text"
                                    id="roomId"
                                    {...register("roomId")}
                                    className="p-2 bg-[#2f2f45] text-primary-50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-900"
                                    placeholder="Enter Room ID"
                                />
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
                                    value={userId}

                                    {...register("userId")}
                                    className="p-2 text-center bg-[#2f2f45] text-primary-50 rounded-md focus:outline-none"
                                />
                            </div>

                            <button
                                className="w-full mt-4 p-2 rounded-md text-center text-primary-50"
                                style={{ background: 'linear-gradient(135deg, #C13530, #8e44ad)' }}
                            >
                                JOIN THE ROOM
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

