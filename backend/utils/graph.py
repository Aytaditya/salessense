import pandas as pd
from neo4j import GraphDatabase
from datetime import datetime

class TransactionGraphDB:
    def __init__(self, uri, user, password):
        """Initialize Neo4j connection"""
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def close(self):
        """Close the driver connection"""
        self.driver.close()
    
    def clear_database(self):
        """Clear all nodes and relationships"""
        with self.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
            print("Database cleared!")
    
    def create_constraints(self):
        """Create constraints for better performance"""
        with self.driver.session() as session:
            # Create constraints
            constraints = [
                "CREATE CONSTRAINT IF NOT EXISTS FOR (t:Transaction) REQUIRE t.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Customer) REQUIRE c.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (co:Country) REQUIRE co.name IS UNIQUE"
            ]
            for constraint in constraints:
                session.run(constraint)
            print("Constraints created!")
    
    def load_data_from_excel(self, file_path):
        """Load data from Excel file into Neo4j"""
        # Read CSV file
        df = pd.read_csv(file_path)
        
        print(f"Loading {len(df)} transactions into Neo4j...")
        
        with self.driver.session() as session:
            for idx, row in df.iterrows():
                # Create transaction and relationships
                session.run("""
                    // Create or merge Product
                    MERGE (p:Product {id: $product_no})
                    ON CREATE SET p.name = $product_name, p.price = $price
                    
                    // Create or merge Customer
                    MERGE (c:Customer {id: $customer_no})
                    
                    // Create or merge Country
                    MERGE (co:Country {name: $country})
                    
                    // Link Customer to Country
                    MERGE (c)-[:LIVES_IN]->(co)
                    
                    // Merge Transaction (in case of duplicates)
                    MERGE (t:Transaction {id: $transaction_no})
                    ON CREATE SET 
                        t.date = $date,
                        t.quantity = $quantity,
                        t.total_amount = $total_amount
                    
                    // Link Transaction to Product, Customer
                    MERGE (t)-[:PURCHASED]->(p)
                    MERGE (c)-[:MADE]->(t)
                """, 
                    transaction_no=str(row['TransactionNo']),
                    date=str(row['Date']),
                    product_no=str(row['ProductNo']),
                    product_name=str(row['ProductName']),
                    price=float(row['Price']),
                    quantity=int(row['Quantity']),
                    customer_no=str(row['CustomerNo']),
                    country=str(row['Country']),
                    total_amount=float(row['Price']) * int(row['Quantity'])
                )
                
                if (idx + 1) % 100 == 0:
                    print(f"Loaded {idx + 1} transactions...")
        
        print(f"Successfully loaded all {len(df)} transactions!")

    def run_custom_query(self, cypher_query):
        """Execute a custom Cypher query"""
        with self.driver.session() as session:
            result = session.run(cypher_query)
            return pd.DataFrame([dict(record) for record in result])


    
    def query_graph(self, query_text):
        """
        Answer natural language queries about the data
        """
        query_text_lower = query_text.lower()
        
        with self.driver.session() as session:
            # Query 1: Total sales by product
            if 'sales' in query_text_lower and 'product' in query_text_lower:
                result = session.run("""
                    MATCH (t:Transaction)-[:PURCHASED]->(p:Product)
                    RETURN p.name AS Product, 
                           SUM(t.total_amount) AS TotalSales,
                           SUM(t.quantity) AS TotalQuantity
                    ORDER BY TotalSales DESC
                """)
                return pd.DataFrame([dict(record) for record in result])
            
            # Query 2: Customer purchase history
            elif 'customer' in query_text_lower and any(x in query_text_lower for x in ['purchase', 'bought', 'history']):
                result = session.run("""
                    MATCH (c:Customer)-[:MADE]->(t:Transaction)-[:PURCHASED]->(p:Product)
                    RETURN c.id AS CustomerID,
                           COUNT(t) AS TotalTransactions,
                           SUM(t.total_amount) AS TotalSpent,
                           COLLECT(DISTINCT p.name) AS ProductsPurchased
                    ORDER BY TotalSpent DESC
                    LIMIT 10
                """)
                return pd.DataFrame([dict(record) for record in result])
            
            # Query 3: Sales by country
            elif 'country' in query_text_lower or 'location' in query_text_lower:
                result = session.run("""
                    MATCH (c:Customer)-[:LIVES_IN]->(co:Country)
                    MATCH (c)-[:MADE]->(t:Transaction)
                    RETURN co.name AS Country,
                           COUNT(DISTINCT c) AS Customers,
                           COUNT(t) AS Transactions,
                           SUM(t.total_amount) AS TotalRevenue
                    ORDER BY TotalRevenue DESC
                """)
                return pd.DataFrame([dict(record) for record in result])
            
            # Query 4: Top products
            elif 'top' in query_text_lower and 'product' in query_text_lower:
                result = session.run("""
                    MATCH (t:Transaction)-[:PURCHASED]->(p:Product)
                    RETURN p.name AS Product,
                           COUNT(t) AS TimesPurchased,
                           SUM(t.quantity) AS TotalQuantity,
                           SUM(t.total_amount) AS Revenue
                    ORDER BY Revenue DESC
                    LIMIT 10
                """)
                return pd.DataFrame([dict(record) for record in result])
            
            # Query 5: Customer spending patterns
            elif 'spending' in query_text_lower or 'top customer' in query_text_lower:
                result = session.run("""
                    MATCH (c:Customer)-[:MADE]->(t:Transaction)
                    MATCH (c)-[:LIVES_IN]->(co:Country)
                    RETURN c.id AS CustomerID,
                           co.name AS Country,
                           COUNT(t) AS Transactions,
                           SUM(t.total_amount) AS TotalSpent,
                           AVG(t.total_amount) AS AvgTransaction
                    ORDER BY TotalSpent DESC
                    LIMIT 10
                """)
                return pd.DataFrame([dict(record) for record in result])
            
            # Query 6: Product popularity by country
            elif 'popular' in query_text_lower and 'country' in query_text_lower:
                result = session.run("""
                    MATCH (c:Customer)-[:LIVES_IN]->(co:Country)
                    MATCH (c)-[:MADE]->(t:Transaction)-[:PURCHASED]->(p:Product)
                    WITH co.name AS Country, p.name AS Product, COUNT(t) AS Purchases
                    ORDER BY Country, Purchases DESC
                    RETURN Country, 
                           COLLECT({product: Product, purchases: Purchases})[0..5] AS TopProducts
                """)
                return pd.DataFrame([dict(record) for record in result])
            
            else:
                return "Query not recognized. Try asking about:\n" + \
                       "- 'sales by product'\n" + \
                       "- 'customer purchase history'\n" + \
                       "- 'sales by country'\n" + \
                       "- 'top products'\n" + \
                       "- 'customer spending'\n" + \
                       "- 'popular products by country'"



# Usage Example
if __name__ == "__main__":
    # Neo4j connection details
    URI = "bolt://localhost:7687"
    USER = "neo4j"
    PASSWORD = "test1234"
    
    # Initialize database
    graph_db = TransactionGraphDB(URI, USER, PASSWORD)
    
    try:
        # Clear existing data (IMPORTANT: Uncomment this to start fresh)
        #graph_db.clear_database()
        
        # Create constraints
        graph_db.create_constraints()
        
        # Load data from CSV
        excel_file = "Sales Transaction v.4a.csv"  # Replace with your file path
        #graph_db.load_data_from_excel(excel_file)
        
        # Query examples
        print("\n=== Sales by Product ===")
        result = graph_db.query_graph("sales by product")
        print(result)
        
        print("\n=== Top Customers by Spending ===")
        result = graph_db.query_graph("top customers spending")
        print(result)
        
        print("\n=== Sales by Country ===")
        result = graph_db.query_graph("sales by country")
        print(result)
        
        # Interactive querying
        # print("\n=== Interactive Mode ===")
        # while True:
        #     query = input("\nEnter your query (or 'quit' to exit): ")
        #     if query.lower() == 'quit':
        #         break
        #     result = graph_db.query_graph(query)
        #     print(result)
        query = """
        MATCH (c:Customer)-[:MADE]->(t:Transaction)-[:PURCHASED]->(p:Product)
        WHERE p.name CONTAINS 'LUNCH BAG'
        RETURN DISTINCT c.id AS CustomerID, COUNT(t) AS TimesPurchased
        ORDER BY TimesPurchased DESC
        LIMIT 20
        """
        result = graph_db.run_custom_query(query)
        print("\n=== Custom Query Result ===")
        print(result)
    
    finally:
        graph_db.close()
        print("\nConnection closed.")