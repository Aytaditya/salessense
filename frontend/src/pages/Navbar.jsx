import React from "react"
import { Link } from "react-router"
import { House, Hexagon } from "lucide-react"


const Navbar = () => {
    return (
        <div className="px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Link to="/" className="flex items-center gap-2">
                    <House className="w-6 h-6 text-[#ffb600]" />
                    <div>
                    </div>
                    <div className="text-sm font-semibold">
                        SalesSense AI
                    </div>
                </Link>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#ffb600] flex items-center justify-center font-semibold cursor-pointer">
                AA
            </div>

        </div>
    )
}

export default Navbar