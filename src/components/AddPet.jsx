import React from 'react'
import { useState } from 'react'
import Service from "../services/Service"
export default function AddPuppy() {
  return (
    <div>
            <div className="flex flex-col items-center min-h-screen pt-6 sm:justify-center sm:pt-0 bg-[#111827]">
                <div>
                        <h3 className="text-4xl font-bold text-white">
                            Add Pet
                        </h3>
                </div>
                <div className="w-full px-6 py-4 mt-6 overflow-hidden bg-white shadow-md sm:max-w-md sm:rounded-lg sm:mx-8">
                    <form>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 undefined">
                                Name
                            </label>
                            <div className="flex flex-col items-start">
                                <input
                                    type="text"
                                    className="block w-full mt-1 p-2 border-gray-300 rounded-sm shadow-sm "
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 undefined">
                                Owner Name
                            </label>
                            <div className="flex flex-col items-start">
                                <input
                                    type="text"
                                    className="block w-full mt-1 p-2 border-gray-300 rounded-sm shadow-sm "
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 undefined">
                                Age
                            </label>
                            <div className="flex flex-col items-start">
                                <input
                                    type="number"
                                    className="block w-full mt-1 p-2 border-gray-300 rounded-sm shadow-sm "
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 undefined">
                                Type
                            </label>
                            <div className="flex flex-col items-start">
                                <input
                                    type="text"
                                    className="block w-full mt-1 p-2 border-gray-300 rounded-sm shadow-sm "
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 undefined">
                                Gender
                            </label>
                            <div className="flex flex-col items-start">
                                <input
                                    type="text"
                                    className="block w-full mt-1 p-2 border-gray-300 rounded-sm shadow-sm "
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end mt-4">
                            <button
                                type="submit"
                                className="inline-flex items-center px-4 py-2 ml-4 text-xs font-semibold tracking-widest text-white uppercase transition duration-150 ease-in-out bg-gray-900 border border-transparent rounded-md active:bg-gray-900 false"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
  )
}
