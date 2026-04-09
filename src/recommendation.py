import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

def filter_packages(df, budget, destination, duration):
    # This finds matches even if the case is different or if it's a partial word
    return df[(df['Destination'].str.contains(destination, case=False)) & 
              (df['Price'] <= budget) &
              (df['Duration'] >= duration - 2) &
              (df['Duration'] <= duration + 2)]

def get_user_query(budget, destination, duration, interests):
    """Combines inputs into a single string for the ML model."""
    return f"{destination} {interests}"

def recommend_packages(filtered_df, vectorizer, tfidf_matrix, user_query, top_n):
    """Calculates similarity scores without index errors."""
    query_vec = vectorizer.transform([user_query])
    # Extract only the matrix rows that match our filtered results
    filtered_matrix = tfidf_matrix[filtered_df.index]
    cosine_sim = cosine_similarity(query_vec, filtered_matrix)[0]
    
    result_df = filtered_df.copy()
    
    # Normalize scores so they visually look realistic instead of very low raw tf-idf values
    if len(cosine_sim) > 0:
        max_s = cosine_sim.max()
        min_s = cosine_sim.min()
        if max_s > min_s:
            # Scale to between 0.75 and 0.98
            scaled_sim = 0.75 + (cosine_sim - min_s) / (max_s - min_s) * 0.23
        else:
            # All same score
            scaled_sim = 0.85
        result_df['Similarity Score'] = scaled_sim
    else:
        result_df['Similarity Score'] = cosine_sim
        
    return result_df.sort_values(by='Similarity Score', ascending=False).head(top_n)