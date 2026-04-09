import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer

# Download necessary NLTK data
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)

# Initialize NLP objects once globally for performance
stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

def clean_data(df):
    """
    Clean the travel packages data by removing null values and duplicates.

    Args:
        df (pd.DataFrame): Input DataFrame.

    Returns:
        pd.DataFrame: Cleaned DataFrame.
    """
    # Remove rows with null values
    df_clean = df.dropna()

    # Remove duplicates
    df_clean = df_clean.drop_duplicates()

    print(f"Data cleaned. Original shape: {df.shape}, Cleaned shape: {df_clean.shape}")
    return df_clean

def preprocess_text(text):
    """
    Preprocess text by converting to lowercase, removing punctuation, stopwords, and lemmatizing.

    Args:
        text (str): Input text.

    Returns:
        str: Preprocessed text.
    """
    # Convert to lowercase
    text = str(text).lower()

    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)

    # Tokenize and remove stopwords
    words = text.split()
    words = [word for word in words if word not in stop_words]

    # Lemmatize
    words = [lemmatizer.lemmatize(word) for word in words]

    return ' '.join(words)

def vectorize_descriptions(df, column='Package Description'):
    """
    Vectorize package descriptions using TF-IDF.

    Args:
        df (pd.DataFrame): DataFrame with package descriptions.
        column (str): Column name containing descriptions.

    Returns:
        tuple: (TfidfVectorizer, sparse matrix of TF-IDF vectors)
    """
    # Preprocess descriptions without mutating the original dataframe
    cleaned_docs = df[column].apply(preprocess_text)

    # Create TF-IDF vectorizer
    vectorizer = TfidfVectorizer(max_features=1000, ngram_range=(1, 2))

    # Fit and transform
    tfidf_matrix = vectorizer.fit_transform(cleaned_docs)

    print(f"TF-IDF vectorization completed. Shape: {tfidf_matrix.shape}")
    return vectorizer, tfidf_matrix
