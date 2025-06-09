from preswald import connect, get_df, text, table

# Connect to the uploaded CSV data
connect()
df = get_df("my_dataset")

# Start analysis
text("# ☕ Coffee Consumption Analysis")
text("## Dataset Overview")

# Show basic information
text(f"**Total countries analyzed:** {len(df)}")
text(f"**Data columns:** {len(df.columns)}")

# Display first few rows
table(df.head(10), title="Sample Data - First 10 Countries")

# Show column names
text("## Available Data Columns")
text(str(list(df.columns)))
