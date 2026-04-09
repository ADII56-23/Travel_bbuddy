#!/usr/bin/env python3
"""
Travel Package Recommendation System - INR Edition

This script provides a command-line interface for recommending travel packages
based on user preferences using machine learning techniques.
"""

import argparse
import sys
import os

from src.data_loader import load_data
from src.preprocessing import clean_data, vectorize_descriptions
from src.recommendation import filter_packages, recommend_packages, get_user_query

def main():
    parser = argparse.ArgumentParser(description="Travel Package Recommendation System")
    # Updated help text for INR
    parser.add_argument('--budget', type=float, required=True, help='User budget in Indian Rupee (₹)')
    parser.add_argument('--destination', type=str, required=True, help='Preferred destination')
    parser.add_argument('--duration', type=int, required=True, help='Preferred duration in days')
    parser.add_argument('--interests', type=str, default='', help='User interests (optional)')
    parser.add_argument('--top_n', type=int, default=5, help='Number of recommendations (default: 5)')

    args = parser.parse_args()

    try:
        # Load data
        print("Loading travel packages data...")
        df = load_data('data/travel_packages.csv')

        # Clean data
        print("Cleaning data...")
        df_clean = clean_data(df)

        # Vectorize descriptions
        print("Preprocessing and vectorizing descriptions...")
        vectorizer, tfidf_matrix = vectorize_descriptions(df_clean)

        # Filter packages
        print("Filtering packages based on your preferences...")
        filtered_df = filter_packages(df_clean, args.budget, args.destination, args.duration)

        if filtered_df.empty:
            print("\n" + "!"*40)
            print(f"SORRY: No packages found for '{args.destination}' within ₹{args.budget:,.0f}.")
            
            # Check if the destination exists at all in your 10,000 rows
            if args.destination.lower() not in df_clean['Destination'].str.lower().unique():
                print(f"Hint: '{args.destination}' is not in our database. Check your spelling!")
            else:
                print("Hint: Try increasing your budget or changing the duration.")
            
            print("!"*40 + "\n")
            return
        # Get user query
        user_query = get_user_query(args.budget, args.destination, args.duration, args.interests)

        # Recommend packages
        print("Generating recommendations...")
        recommendations = recommend_packages(filtered_df, vectorizer, tfidf_matrix, user_query, args.top_n)

        # Display results with Rupee symbol
        print("\n" + "="*60)
        print("TOP TRAVEL PACKAGE RECOMMENDATIONS")
        print("="*60)
        print(f"Based on: Budget ₹{args.budget}, Destination: {args.destination}, Duration: {args.duration} days")
        if args.interests:
            print(f"Interests: {args.interests}")
        print()

        for idx, row in recommendations.iterrows():
            print(f"Package: {row['Package Name']}")
            print(f"Destination: {row['Destination']}")
            print(f"Duration: {row['Duration']} days")
            print(f"Price: ₹{row['Price']:,.0f}") # Updated symbol
            print(f"Similarity Score: {row['Similarity Score']:.3f}")
            print(f"Description: {row['Package Description']}")
            print("-" * 40)

        print("\nRecommendations generated using TF-IDF vectorization and cosine similarity.")

    except FileNotFoundError:
        print("Error: travel_packages.csv not found in data/ directory.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()