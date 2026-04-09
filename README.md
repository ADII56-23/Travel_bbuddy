# Travel Package Recommendation System

A machine learning-based system that recommends suitable travel packages to users based on their preferences using content-based filtering with TF-IDF vectorization and cosine similarity.

## Features

- **Personalized Recommendations**: Recommends travel packages based on budget, destination, and duration preferences
- **Content-Based Filtering**: Uses NLP techniques to analyze package descriptions and match user interests
- **Machine Learning Approach**: Employs TF-IDF vectorization and cosine similarity for accurate recommendations
- **Command-Line Interface**: Easy-to-use CLI for quick recommendations- **Modular Design**: Well-structured code for easy maintenance and extension

## Technology Stack

- **Programming Language**: Python 3.7+
- **Libraries**:
  - pandas: Data manipulation
  - numpy: Numerical computations
  - scikit-learn: Machine learning algorithms
  - nltk: Natural Language Processing
  - matplotlib/seaborn: Visualization (optional)

## Installation

1. Clone or download the project files
2. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Run the recommendation system from the command line:

```bash
python main.py --budget <budget> --destination <destination> --duration <duration> [--interests <interests>] [--top_n <number>]
```

### Parameters

- `--budget`: Your travel budget (required)
- `--destination`: Preferred destination (required)
- `--duration`: Trip duration in days (required)
- `--interests`: Additional interests (optional)
- `--top_n`: Number of recommendations to display (default: 5)

### Example

```bash
python main.py --budget 2500 --destination Hawaii --duration 7 --interests "beach snorkeling"
```

## How It Works

1. **Data Loading**: Loads travel package data from CSV
2. **Data Preprocessing**: Cleans data and preprocesses text descriptions using NLP techniques
3. **Filtering**: Filters packages based on user budget, destination, and duration
4. **Vectorization**: Converts package descriptions to TF-IDF vectors
5. **Similarity Calculation**: Computes cosine similarity between user query and package descriptions
6. **Ranking**: Ranks packages by similarity score and returns top recommendations

## Dataset

The system uses a sample dataset (`data/travel_packages.csv`) containing:
- Package Name
- Destination
- Duration (days)
- Price (USD)
- Package Description

## Project Structure

```
travel-recommendation-system/
├── data/
│   └── travel_packages.csv          # Sample dataset
├── src/
│   ├── data_loader.py               # Data loading utilities
│   ├── preprocessing.py             # Data cleaning and NLP preprocessing
│   └── recommendation.py            # Recommendation logic
├── main.py                          # CLI interface
├── requirements.txt                 # Python dependencies
├── README.md                        # Project documentation
└── TODO.md                          # Development tasks
```

## Future Enhancements

- Web-based user interface using Flask or Streamlit
- User feedback integration for improved recommendations
- Collaborative filtering for enhanced personalization
- Integration with real travel APIs
- Advanced NLP models (BERT, GPT) for better text understanding

## License

This project is open-source and available under the MIT License.
