import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify'; // You'll need to install this package

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]); // Add this line
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleFilterExpansion = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/combined.json');
        if (!response.ok) {
          throw new Error('Failed to fetch JSON file');
        }
        const data = await response.json();
        
        const validQuestions = data.filter(q => 
          q.category && q.question && q.answer
        ).map(q => ({
          Category: q.category,
          Question: q.question,
          Answer: q.answer
        }));

        setQuestions(validQuestions);
        setFilteredQuestions(validQuestions);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(validQuestions.map(q => q.Category))];
        setCategories(uniqueCategories);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = questions.filter(
      (question) =>
        (selectedCategories.length === 0 || selectedCategories.includes(question.Category)) &&
        (question.Category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.Question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.Answer.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredQuestions(filtered);
  }, [searchTerm, questions, selectedCategories]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (isLoading) {
    return <div className="loading-message">Loading questions...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  // Add this function to sanitize and render HTML content
  const createMarkup = (htmlContent) => {
    return { __html: DOMPurify.sanitize(htmlContent) };
  };

  return (
    <div className="question-list">
      <div className="sticky-top">
        <div className={`filter-container ${isFilterExpanded ? 'expanded' : ''}`}>
          <button className="filter-toggle" onClick={toggleFilterExpansion}>
            {isFilterExpanded ? 'Hide Categories' : 'Show Categories'}
          </button>
          <div className="category-list">
            {categories.map((category, index) => (
              <div key={index} className="category-checkbox">
                <label>
                  <input
                    type="checkbox"
                    value={category}
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                  />
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          {searchTerm && (
            <button onClick={clearSearch} className="clear-button">
              ×
            </button>
          )}
        </div>
      </div>
      <div className="scrollable-content">
        {filteredQuestions.length > 0 ? (
          <div className="grid-x grid-margin-x">
            {filteredQuestions.map((question, index) => (
              <div key={index} className="cell small-12 medium-6 large-4">
                <div className="question-item">
                  <div className="question-category">{question.Category}</div>
                  <div className="question-text" dangerouslySetInnerHTML={createMarkup(question.Question)} />
                  <div className="answer-text" dangerouslySetInnerHTML={createMarkup(question.Answer)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            No questions found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionList;