# SalesSense AI

**Intelligent Business Operations Platform for Modern Retailers**

SalesSense AI transforms how small and medium retailers manage their business operations through powerful AI-driven automation and insights.

## 🚀 Overview

SalesSense AI is a comprehensive internal tool that empowers shop owners with intelligent features to streamline operations, reduce costs, and make data-driven decisions. Our platform combines natural language processing with business intelligence to create a seamless management experience.

## ✨ Features

### 🔍 **Cotex: Natural Language to SQL Analytics**
- **Convert everyday questions into actionable insights**
- Ask questions like "What were my top 5 products last month?" and get instant answers
- Automatic query execution and result summarization
- No technical skills required - just ask naturally
- Processed Sales data of 5 Lakh Rows

### 📦 **Smart Ordering Agent**
- **AI-powered ordering and inventory control**
- Process natural language orders: "Order 50 units of coffee beans from Supplier A"
- Automatic inventory tracking and low-stock alerts
- Supplier performance monitoring and optimization

### 📑 **Contract AI Studtio**
- **Smart contract analysis and management**
- **Contract Analyzer**: Risk detection and obligation tracking
- **Contract Comparator**: Version control and supplier benchmarking  
- **Contract Extraction**: Automated data extraction and deadline monitoring

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/Aytaditya/salessense.git

# Navigate to project directory
cd salessense

# Install dependencies
npm install

# Set up environment variables
cp .env

# Start the development server
npm run dev
```

## 🔧 Configuration

1. **AI Services**: Add your API keys for AI models (Gemini)
2. **Business Data**: Connect your sales data, inventory systems, and contract repositories (Excel)

## 💡 Usage Examples

### Data Analysis
```plaintext
User: "If we lost our top 5 customers, how much revenue risk would we face?"
AI: → Gives SQL query → Returns:"SELECT SUM(customer_revenue) AS total_revenue_risk_from_top_5_customers
FROM (
    SELECT CustomerNo, SUM(Price * Quantity) AS customer_revenue
    FROM data
    WHERE CustomerNo IS NOT NULL AND Price IS NOT NULL AND Quantity IS NOT NULL AND Quantity > 0
    GROUP BY CustomerNo
    ORDER BY customer_revenue DESC
    LIMIT 5
);" AI: Summarizes → Returns:"If we were to lose your top 5 customers, you would be facing a revenue risk of $5,827,340.02. This figure represents the total revenue these five highest-spending customers currently bring in."
```

### Inventory Management  
```plaintext
User: "Sare items do do packet kar do"
AI: → Analyzes sales patterns → Places orders → Confirms: "Ordered 2 units of every product from Supplier"
```

### Contract Analysis
```plaintext
User: "Difference Between these 2 Versions of Contract"
AI: → Extracts key terms → Flags → Summarizes obligations
```

## 🎯 Target Users

- **Retail Shop Owners** managing daily operations
- **Small Business Managers** overseeing multiple locations  
- **Business Owners** handling supplier relationships and contracts
