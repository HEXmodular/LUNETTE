function updateOscillator(oscillator_id, value) {
    // Only send if not already sending
    if (!updateOscillator.isSending) {
        updateOscillator.isSending = true;
        
        fetch('/api/oscillator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                oscillator_id: oscillator_id,
                frequency: value,
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error updating oscillator:', error);
        })
        .finally(() => {
            updateOscillator.isSending = false;
        });
    }
}