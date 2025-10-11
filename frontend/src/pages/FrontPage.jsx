import { Link } from "react-router"
import { BriefcaseBusiness, ArrowRight,Brain, Coins, NotebookPen } from "lucide-react"


const FrontPage = () => {
	return (
		<div className="w-full h-full flex flex-grow flex-row my-auto">

			<div className="flex-4 my-auto flex flex-col px-24">
				{/* Background graphics */}
                      <img src="/bgLeft.svg" alt="" className="absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 right-0" />
                      <img src="/bgRight.svg" alt="" className="absolute h-[80%] object-cover -z-10 top-1/2 -translate-y-1/2 left-0" />
				<div>

					<h1 className="text-3xl font-medium mb-2">
						Welcome to the{" "}
						<span className="text-[#ffb600]">
                        SalesSense AI
						</span>
					</h1>
					<p className="text-gray-100 text-lg font-light mb-8">
                    Designed for 360° intelligence for smarter retail decisions.
					</p>
				</div>
				<div className="mt-16">
					<p className="text-lg font-light mb-4">Get started with:</p>
					<div className="flex gap-4">
						{/* Card 1 */}
						<Link
							to="/cortex"
							className="py-6 bg-[#303030] rounded-4xl shadow-lg  w-64 flex flex-col hover:shadow-md transition-shadow">
							<div className="mx-6 w-12 h-12 bg-[#D93954] rounded-xl mb-6 flex items-center justify-center">
                                <Brain  className="w-6 h-6"/>
							</div>
							<p className="px-6 font-extralight mb-14">
                            Real-Time Sales Data Analysis with Cortex AI Assistant
							</p>
							<div className="mt-auto w-full  pt-6 border-t border-[#3E3E3E] text-right">
                                <ArrowRight className="ml-auto w-6 h-6 mr-6 text-[#ffb600]" />
							</div>
						</Link>

						{/* Card 2 */}
						<Link
							to="/order-agent"
							className="py-6 bg-[#303030] rounded-4xl shadow-lg  w-64 flex flex-col hover:shadow-md transition-shadow ">
							<div className="mx-6 w-12 h-12 bg-[#E45C2B] rounded-xl mb-6 flex items-center justify-center">
                            <Coins  className="w-6 h-6"/>
							</div>
							<p className="px-6 font-extralight">
								Smart Ordering Agent
							</p>
							<div className="mt-auto w-full mt-24 pt-6 border-t border-[#3E3E3E] text-right">
                                <ArrowRight className="ml-auto w-6 h-6 mr-6 text-[#ffb600]" />
							</div>
						</Link>

						{/* Card 3 */}
						<Link
							to="/contracts-page"
							className="py-6 bg-[#303030] rounded-4xl shadow-lg  w-64 flex flex-col hover:shadow-md transition-shadow">
							<div className="mx-6 w-12 h-12 bg-[#E0301E] rounded-xl mb-6 flex items-center justify-center">
                            <BriefcaseBusiness className="w-6 h-6"/>
							</div>
							<p className="px-6 font-extralight">
								Contracts AI Studio
							</p>
							<div className="mt-auto w-full mt-24 pt-6 border-t border-[#3E3E3E] text-right">
                                <ArrowRight className="ml-auto w-6 h-6 mr-6 text-[#ffb600]" />
							</div>
						</Link>
						{/* Card 4 - Explore_Services */}
						{/* <Link
							to="/"
							className="py-6 bg-[#303030] rounded-4xl shadow-lg w-64 flex flex-col hover:shadow-md transition-shadow">
							<div className="mx-6 w-12 h-12 bg-[#28A745] rounded-xl mb-6 flex items-center justify-center">
                            <NotebookPen  className="w-6 h-6"/>
							</div>
							<p className="px-6 font-extralight">
								Third Party Integrations 
							</p>
							<div className="mt-auto w-full mt-24 pt-6 border-t border-[#3E3E3E] text-right cursor-not-allowed">
                                <ArrowRight className="ml-auto w-6 h-6 mr-6 text-[#ffb600]" />
							</div>
						</Link> */}

					</div>
				</div>
			</div>

			{/* Sphere image on the right */}
			<div className="flex-3 flex items-center"></div>
		</div>
	)
}

export default FrontPage
