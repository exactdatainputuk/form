import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    over18: '',
    dataEntryExperience: '',
    experienceDescription: '',
    accessibility: '',
    hoursPerWeek: '',
    hasComputer: '',
    rightToWork: '',
    criminalConvictions: '',
    dbsCheck: '',
    englishFluency: '',
    otherLanguages: '',
    selfDescription: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const generateReferenceNumber = () => {
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `EDI${randomNum}`;
  };

  const getAmountFromHours = (hours: string) => {
    const amountMap: { [key: string]: string } = {
      '10': '£165',
      '20': '£330',
      '30': '£495',
      '40': '£660',
      '50': '£825'
    };
    return amountMap[hours] || '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      setUploadedFile(null);
      return;
    }
    
    const fileType = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'doc', 'docx'].includes(fileType || '')) {
      setError('Only PDF, DOC, or DOCX files are allowed');
      setUploadedFile(null);
      return;
    }

    setUploadedFile(file);
    setError(null);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }, []);

  const validateForm = () => {
    if (!formData.email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'over18',
      'dataEntryExperience',
      'accessibility',
      'hoursPerWeek',
      'hasComputer',
      'rightToWork',
      'criminalConvictions',
      'dbsCheck',
      'englishFluency',
      'selfDescription'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      throw new Error('Please fill in all required fields');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      validateForm();

      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = import.meta.env.VITE_BREVO_API_KEY;

      const apiInstance = new SibApiV3Sdk.ContactsApi();
      const createContact = new SibApiV3Sdk.CreateContact();
      const referenceNumber = generateReferenceNumber();

      createContact.email = formData.email;
      createContact.attributes = {
        FIRSTNAME: formData.firstName,
        LASTNAME: formData.lastName,
        HOURS: formData.hoursPerWeek,
        AMOUNT: getAmountFromHours(formData.hoursPerWeek),
        UNIQUE: referenceNumber
      };
      createContact.listIds = [7];

      try {
        await apiInstance.createContact(createContact);
        window.location.href = `https://exactdatainput.uk/application-submitted?email=${encodeURIComponent(formData.email)}`;
      } catch (apiError: any) {
        console.error('Detailed API Error:', apiError);
        
        const errorMessage = apiError.response?.text 
          ? JSON.parse(apiError.response.text).message
          : 'Unable to connect to the server. Please check your internet connection and try again.';
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('There was an error submitting your application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a]";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#ededed] py-6">
        <div className="container mx-auto px-2 sm:px-4 text-center">
          <img 
            src="https://ik.imagekit.io/3ckehjsun/StreamStick-2.png" 
            alt="Logo" 
            className="h-6 mx-auto mb-2"
          />
          <p className="text-gray-600 text-sm">New Application (April 2025 Intake)</p>
        </div>
      </header>

      {/* Form Container */}
      <main className="container mx-auto px-2 sm:px-4 py-8 max-w-3xl">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 sm:p-8" id="application-form" name="application-form">
          <div className="space-y-10">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  className={inputClasses}
                  onChange={handleInputChange}
                  autoComplete="given-name"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  className={inputClasses}
                  onChange={handleInputChange}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className={inputClasses}
                onChange={handleInputChange}
                autoComplete="email"
              />
              <p className="mt-1 text-sm text-gray-500">
                We will only email you with updates on your application, we don't share any information with third parties.
              </p>
            </div>

            {/* Age Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Are you over 18?</label>
              <div className="mt-2 space-x-4">
                <label htmlFor="over18-yes" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="over18-yes"
                    name="over18"
                    value="yes"
                    required
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label htmlFor="over18-no" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="over18-no"
                    name="over18"
                    value="no"
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Do you have any previous data entry experience?
              </label>
              <div className="mt-2 space-x-4">
                <label htmlFor="dataEntryExperience-yes" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="dataEntryExperience-yes"
                    name="dataEntryExperience"
                    value="yes"
                    required
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label htmlFor="dataEntryExperience-no" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="dataEntryExperience-no"
                    name="dataEntryExperience"
                    value="no"
                    required
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Don't worry if your answer is 'No', most applicants that we hire have no previous experience.
              </p>
            </div>

            <div>
              <label htmlFor="experienceDescription" className="block text-sm font-medium text-gray-700">
                If 'Yes' please give a brief description of your previous experience (Optional)
              </label>
              <textarea
                id="experienceDescription"
                name="experienceDescription"
                rows={2}
                className={inputClasses}
                onChange={handleInputChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Skip this if you answered 'No' to the previous question.
              </p>
            </div>

            {/* Accessibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Do you have any accessibility requirements?
              </label>
              <div className="mt-2 space-x-4">
                {['Yes', 'No', 'Prefer Not To Say'].map((option) => (
                  <label key={option} htmlFor={`accessibility-${option.toLowerCase().replace(/\s+/g, '-')}`} className="inline-flex items-center">
                    <input
                      type="radio"
                      id={`accessibility-${option.toLowerCase().replace(/\s+/g, '-')}`}
                      name="accessibility"
                      value={option.toLowerCase()}
                      required
                      className="form-radio text-[#1a1a1a]"
                      onChange={handleInputChange}
                    />
                    <span className="ml-2">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                How many hours a week do you want to work?
              </label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-4">
                {[10, 20, 30, 40, 50].map((hours) => (
                  <label key={hours} htmlFor={`hours-${hours}`} className="inline-flex items-center">
                    <input
                      type="radio"
                      id={`hours-${hours}`}
                      name="hoursPerWeek"
                      value={hours}
                      required
                      className="form-radio text-[#1a1a1a]"
                      onChange={handleInputChange}
                    />
                    <span className="ml-2">{hours} Hours</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Computer Access */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Do you have access to a laptop or desktop computer?
              </label>
              <div className="mt-2 space-x-4">
                <label htmlFor="hasComputer-yes" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="hasComputer-yes"
                    name="hasComputer"
                    value="yes"
                    required
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label htmlFor="hasComputer-no" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="hasComputer-no"
                    name="hasComputer"
                    value="no"
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>

            {/* Right to Work */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Do you have the legal right to work in the UK?
              </label>
              <div className="mt-2 space-x-4">
                <label htmlFor="rightToWork-yes" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="rightToWork-yes"
                    name="rightToWork"
                    value="yes"
                    required
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label htmlFor="rightToWork-no" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="rightToWork-no"
                    name="rightToWork"
                    value="no"
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                If you have a National Insurance number then you can answer 'Yes'.
              </p>
            </div>

            {/* Criminal Convictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Have you had any criminal convictions in the past 10 years?
              </label>
              <div className="mt-2 space-x-4">
                <label htmlFor="criminalConvictions-yes" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="criminalConvictions-yes"
                    name="criminalConvictions"
                    value="yes"
                    required
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label htmlFor="criminalConvictions-no" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="criminalConvictions-no"
                    name="criminalConvictions"
                    value="no"
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>

            {/* DBS Check */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Would you be happy to undergo a DBS check?
              </label>
              <div className="mt-2 space-x-4">
                <label htmlFor="dbsCheck-yes" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="dbsCheck-yes"
                    name="dbsCheck"
                    value="yes"
                    required
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label htmlFor="dbsCheck-no" className="inline-flex items-center">
                  <input
                    type="radio"
                    id="dbsCheck-no"
                    name="dbsCheck"
                    value="no"
                    className="form-radio text-[#1a1a1a]"
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>

            {/* English Fluency */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Are you fluent in English?
              </label>
              <div className="mt-2 space-y-2">
                {[
                  "Yes, I'm a native speaker.",
                  "Yes, I'm fluent but it's not my first language.",
                  "I'm not fluent but I can speak basic English.",
                  "I cannot speak English."
                ].map((option) => (
                  <label key={option} htmlFor={`englishFluency-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} className="block">
                    <input
                      type="radio"
                      id={`englishFluency-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      name="englishFluency"
                      value={option}
                      required
                      className="form-radio text-[#1a1a1a]"
                      onChange={handleInputChange}
                    />
                    <span className="ml-2">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Other Languages */}
            <div>
              <label htmlFor="otherLanguages" className="block text-sm font-medium text-gray-700">
                Excluding English, which other languages can you speak fluently? (Optional)
              </label>
              <input
                type="text"
                id="otherLanguages"
                name="otherLanguages"
                className={inputClasses}
                onChange={handleInputChange}
              />
            </div>

            {/* Self Description */}
            <div>
              <label htmlFor="selfDescription" className="block text-sm font-medium text-gray-700">
                Describe yourself in a few words
              </label>
              <textarea
                id="selfDescription"
                name="selfDescription"
                rows={4}
                required
                className={inputClasses}
                onChange={handleInputChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Just a brief description of your personality, hobbies, interests etc.
              </p>
            </div>

            {/* CV Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload your CV (Optional)
              </label>
              <label
                htmlFor="cv-upload"
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer transition-colors duration-200 ${
                  isDragging ? 'border-[#5271FF] bg-blue-50' : 'hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-1 text-center">
                  {!uploadedFile ? (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <span className="relative bg-white rounded-md font-medium text-[#1a1a1a] hover:text-[#333333]">
                          Click to upload
                          <input 
                            id="cv-upload" 
                            name="cv-upload" 
                            type="file" 
                            className="sr-only" 
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                          />
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC up to 10MB
                      </p>
                    </>
                  ) : (
                    <div className="text-sm">
                      <p className="text-gray-900 font-medium">{uploadedFile.name}</p>
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="mt-2 text-[#5271FF] hover:text-[#3d5bff] focus:outline-none"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#5271FF] hover:bg-[#5271FF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5271FF]'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default App;