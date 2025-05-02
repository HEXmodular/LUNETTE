function updateOscillator(value) {
    // Only send if not already sending
    if (!updateOscillator.isSending) {
        updateOscillator.isSending = true;
        
        fetch('/api/oscillator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                frequency: value,
                amplitude: 127.0 // Using default amplitude from note_generator.c
            })
        })
        .finally(() => {
            updateOscillator.isSending = false;
        });
    }
}