import React from "react";
import toast, { Toaster } from 'react-hot-toast';
import '../Components/Login.css'
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

export const Login = () => {

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    const navigate =  useNavigate();


    const onSubmit = async (data) => {
        console.log(data)
        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })
            const result = await response.json();
            console.log(result);
            if (result.success == true) {
                toast.success(result.message);
                localStorage.setItem('token', result.token);
                navigate('/startGame')
            }
            else if (result.success === false) {
                toast.error(result.message);
            }
        }
        catch (err) {
            console.log(err);
            toast.error('Something error occured')
        }
    }
        return (
            <div id="webcrumbs">
                <div className="w-full h-[900px] bg-black text-primary-50 rounded-lg flex justify-center items-center"
                    style={{
                        background: "linear-gradient(135deg, #2F2C59, #F0209B)",
                    }}
                >
                    <Toaster/>
                    <div className="w-[400px] h-auto bg-[#1c1b3a] rounded-lg p-6 flex flex-col justify-start">
                        <h1 className="font-title text-2xl mb-2">Login</h1>
                        <p className="text-sm mb-4">Welcome back!</p>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="w-full space-y-3.5">
                                <div className="flex flex-col">
                                    <label htmlFor="username" className="text-sm pb-1">
                                        Username
                                    </label>
                                    <input
                                        type="username"
                                        id="username"
                                        {...register("username", { required: "username is required", type: "username" })}
                                        className="p-2 bg-[#2f2f45] text-primary-50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-900"
                                        placeholder="Enter your username"
                                    />
                                    {errors.username && <span className="text-yellow-300">{errors.username.message}</span>}
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="password" className="text-sm pb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        {...register("password", { required: "Password  is required", minLength: { value: 6, message: "Password should be of 6 length" } })}
                                        className="p-2 bg-[#2f2f45] text-primary-50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-900"
                                        placeholder="Enter your password"
                                    />
                                    {errors.password && <span className="text-yellow-300">{errors.password.message}</span>}
                                </div>
                                <div className="text-right mt-0.5">
                                    <a href="#" className="text-xs text-primary-300 hover:underline">
                                        Forgot password?
                                    </a>
                                </div>
                                <button
                                    className="w-full mt-4 p-2 rounded-md text-center text-primary-50"
                                    style={{ background: "linear-gradient(135deg, #C13530, #8e44ad)" }}
                                >
                                    Login
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

