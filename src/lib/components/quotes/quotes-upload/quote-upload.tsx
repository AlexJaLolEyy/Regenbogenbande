"use client";

import { useState } from "react";
import { Quote } from "../../../types/types";

export default function QuoteUpload({ quote }: { quote?: Quote }
) {

        const [formData, setFormData] = useState({
            name: '',
            email: '',
            message: '',
        });

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData({
                ...formData,
                [name]: value,
            });
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            console.log('Form Data Submitted:', formData);
            // Handle the form submission here
        };

        return (
            <div>
                <div>
                    <p>You are currently at Quote-Upload!</p>

                    <p> This part needs a lot more work than every other upload combined.</p>
                    <p> The Developer is in charge of creating a unique option to upload a quote, bc u cant just select them like vids.</p>
                    <p> I dont wanna be that Dev... poor developer...</p>
                </div>



                <div>
                    <form onSubmit={handleSubmit} onChange={() => {console.log("form change!")}}>
                            
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>
        )
    }