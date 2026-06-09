import { useState, useEffect } from 'react';

export function useSavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);

  useEffect(() => {
    const loadSavedJobs = () => {
      const stored = localStorage.getItem('saved_jobs');
      if (stored) {
        setSavedJobs(JSON.parse(stored));
      }
    };
    loadSavedJobs();

    window.addEventListener('savedJobsChanged', loadSavedJobs);
    return () => window.removeEventListener('savedJobsChanged', loadSavedJobs);
  }, []);

  const saveJob = (job) => {
    const current = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    if (!current.find(j => j.id === job.id)) {
      const updated = [...current, job];
      localStorage.setItem('saved_jobs', JSON.stringify(updated));
      window.dispatchEvent(new Event('savedJobsChanged'));
      return true;
    }
    return false;
  };

  const unsaveJob = (jobId) => {
    const current = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    const updated = current.filter(j => j.id !== jobId);
    localStorage.setItem('saved_jobs', JSON.stringify(updated));
    window.dispatchEvent(new Event('savedJobsChanged'));
  };

  const isJobSaved = (jobId) => {
    return savedJobs.some(j => j.id === jobId);
  };

  return { savedJobs, saveJob, unsaveJob, isJobSaved };
}
