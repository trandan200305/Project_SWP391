import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8080/api/projects';

export function useSavedJobs(user) {
  const [savedJobs, setSavedJobs] = useState([]);

  useEffect(() => {
    const loadSavedJobs = async () => {
      if (user) {
        try {
          const res = await fetch(`${API_URL}/saved?userId=${user.id}&userRole=${user.role || 'FREELANCER'}`);
          if (res.ok) {
            const data = await res.json();
            setSavedJobs(data);
            // Also sync local storage
            localStorage.setItem('saved_jobs', JSON.stringify(data));
            return;
          }
        } catch (err) {
          console.error("Failed to load saved jobs from server", err);
        }
      }
      
      const stored = localStorage.getItem('saved_jobs');
      if (stored) {
        setSavedJobs(JSON.parse(stored));
      } else {
        setSavedJobs([]);
      }
    };
    loadSavedJobs();

    window.addEventListener('savedJobsChanged', loadSavedJobs);
    return () => window.removeEventListener('savedJobsChanged', loadSavedJobs);
  }, [user]);

  const saveJob = async (job) => {
    if (user) {
      try {
        await fetch(`${API_URL}/${job.id}/save?userId=${user.id}&userRole=${user.role || 'FREELANCER'}`, { method: 'POST' });
      } catch (err) {
        console.error("Failed to save job to server", err);
      }
    }
    
    const current = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    if (!current.find(j => j.id === job.id)) {
      const updated = [...current, job];
      localStorage.setItem('saved_jobs', JSON.stringify(updated));
      window.dispatchEvent(new Event('savedJobsChanged'));
      return true;
    }
    return false;
  };

  const unsaveJob = async (jobId) => {
    if (user) {
      try {
        await fetch(`${API_URL}/${jobId}/save?userId=${user.id}&userRole=${user.role || 'FREELANCER'}`, { method: 'DELETE' });
      } catch (err) {
        console.error("Failed to unsave job to server", err);
      }
    }

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
