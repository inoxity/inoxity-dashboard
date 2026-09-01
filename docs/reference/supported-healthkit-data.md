# Supported Apple Health data

The schema version 8 dashboard and current iOS registry support the identifiers below. Availability still depends on the participant's device, iOS/HealthKit support, recorded data, and granted permission.

## Sleep

- Sleep

## Activity and fitness

- Steps; active energy; exercise time; workouts
- Walking/running, cycling, swimming, and wheelchair distance
- Flights climbed; push count; swimming strokes; resting energy; stand time
- Walking speed, step length, asymmetry, and double-support percentage
- Six-minute walk distance; stair ascent and descent speed

## Heart and vitals

- Resting heart rate; heart rate; heart-rate variability; respiratory rate
- Blood oxygen; blood glucose; blood pressure
- Forced vital capacity; forced expiratory volume; peak expiratory flow
- Inhaler usage; insulin delivery; falls
- High-heart-rate, low-heart-rate, and irregular-rhythm events

## Body measurements

- Height; body mass; body-mass index; lean body mass; body-fat percentage
- Waist circumference; body temperature; basal body temperature; electrodermal activity

## Hearing and environment

- Environmental sound and headphone audio exposure
- Time in daylight; UV exposure; water temperature; underwater depth

## Nutrition

- Energy, protein, carbohydrates, fiber, sugar
- Total, saturated, monounsaturated, and polyunsaturated fat; cholesterol
- Sodium, potassium, calcium, iron, magnesium, zinc
- Vitamins A, C, D, E, K, B6, and B12
- Caffeine and water

## Mindfulness

- Mindful minutes

## Reproductive health

- Menstrual flow; intermenstrual bleeding; sexual activity; ovulation test result
- Contraceptive use; pregnancy; pregnancy test result; lactation; cervical mucus quality

## Symptoms

- Abdominal cramps; bloating; constipation; diarrhea; dizziness; fatigue; fever
- Generalized body ache; headache; heartburn; loss of smell; loss of taste; nausea
- Rapid or fluttering heartbeat; runny nose; shortness of breath; sinus congestion; sore throat
- Vomiting; wheezing; coughing; chills; chest tightness or pain
- Mood changes; sleep changes; memory lapse; hot flashes; lower-back pain; appetite changes; bladder incontinence

## Exclusions and special cases

Clinical Records and Health Documents are excluded because they require authorization beyond the standard read flow implemented here. ECG and audiograms are excluded because their waveform structures do not fit the normalized sample pipeline.

Most category types store Apple's raw integer enum value. Sleep analysis retains a friendly state representation. Blood pressure is stored as a correlation and is not currently displayed in See My Data.

!!! warning
    A type's technical availability is not permission to collect it. Select only data covered by the study's protocol, consent, privacy disclosures, and governance approvals.
