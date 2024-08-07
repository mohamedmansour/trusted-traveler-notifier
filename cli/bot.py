import argparse
from datetime import datetime
from enum import Enum
import logging
import json
import signal
import sys
import threading
import time

import requests
import simpleaudio

LOGGING_FORMAT = '%(asctime)s %(name)-12s %(levelname)-8s %(message)s'
SLOT_AVAILABILITY_URL = 'https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId={location}'

stats = {
    'success': 0,
    'json_decode_error': 0,
    'connection_error': 0,
    'started_at': datetime.now().isoformat(),
    'ended_at': None
}

exit_event = threading.Event()

class Month(Enum):
    JANUARY = 1
    FEBRUARY = 2
    MARCH = 3
    APRIL = 4
    MAY = 5
    JUNE = 6
    JULY = 7
    AUGUST = 8
    SEPTEMBER = 9
    OCTOBER = 10
    NOVEMBER = 11
    DECEMBER = 12
    
def check_for_slots(location_name, location_code, max_month: Month):
    url = SLOT_AVAILABILITY_URL.format(location=location_code)
    try:
        results = requests.get(url).json() 
        stats['success'] += 1
    except requests.JSONDecodeError:
        stats['json_decode_error'] += 1
        return False
    except requests.ConnectionError:
        stats['connection_error'] += 1
        return False

    available_slots = results['availableSlots']
    valid_slots = [slot for slot in available_slots if datetime.strptime(slot['startTimestamp'], '%Y-%m-%dT%H:%M').month <= max_month.value]

    if len(valid_slots) > 0:
        available_slots_text = ', '.join([slot['startTimestamp'] for slot in valid_slots])
        logging.info('{} slots found for {}: {}'.format(
            len(valid_slots),
            location_name,
            available_slots_text))
        wave_obj = simpleaudio.WaveObject.from_wave_file('sonar.wav')
        wave_obj.play()
        return True
    else:
        return False
    
def signal_handler(sig, frame):
    stats['ended_at'] = datetime.now().isoformat()
    stats['duration'] = (datetime.fromisoformat(stats['ended_at']) - datetime.fromisoformat(stats['started_at'])).total_seconds()
    logging.info('Stats: {}'.format(json.dumps(stats, indent=4)))
    exit_event.set()

def sleep_with_interrupt(duration):
    """Sleep for the specified duration, checking for exit events."""
    sleep_interval = 1
    for _ in range(duration):
        if exit_event.is_set():
            break
        exit_event.wait(sleep_interval)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sleep-duration', '-s', type=int, default=5, help='Number of seconds to sleep between checks')
    args = parser.parse_args()

    logging.basicConfig(format=LOGGING_FORMAT,
                        level=logging.INFO,
                        stream=sys.stdout)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    while not exit_event.is_set():
        check_for_slots(location_name='WA', location_code=5020, max_month=Month.AUGUST)
        sleep_with_interrupt(args.sleep_duration)

if __name__ == '__main__':
    main()
