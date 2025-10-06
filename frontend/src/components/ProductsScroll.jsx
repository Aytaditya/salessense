import React from 'react'

const ProductsScroll = ({product}) => {
  return (
    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
            <div className="p-4 space-y-3">
              {inventory.map((product) => {
                const stockStatus = getStockStatus(product.Stock);
                const categoryColor = getCategoryColor(product.Category);
                
                return (
                  <div
                    key={product.Product_ID}
                    className={`bg-[#252525] rounded-lg p-4 border border-gray-600 cursor-pointer transition-all duration-200 hover:border-[#D93954] ${categoryColor} border-l-4`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{product.English_Name}</h3>
                        <p className="text-gray-400 text-xs">{product.Product_ID}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color} flex-shrink-0 ml-2`}>
                        {stockStatus.label}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Price</p>
                          <p className="text-white font-semibold">₹{product.Price}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Stock</p>
                          <p className="text-white font-semibold">{product.Stock}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Category</p>
                          <p className="text-white font-semibold text-xs">{product.Category}</p>
                        </div>
                      </div>
                      
                      <div className={`w-2 h-2 rounded-full ${stockStatus.bg.replace('900', '500')} flex-shrink-0`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
  )
}

export default ProductsScroll
