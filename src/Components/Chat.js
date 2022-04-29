import {serverTimestamp} from 'firebase/database';
import {useEffect, useRef, useState} from 'react';
import {listen, update} from '../firebase';
import {useStatePersist} from '../hooks/useStatePersist';
import {groupBy, guid, objToArr} from '../utils';
import './chat.css';

const listenToMessages = (onChange, onError) =>
  listen('messages', onChange, onError);

const sendMessage = (msg, user, onError) =>
  update(
    {
      [`messages/${guid()}`]: {
        message: msg.trim(),
        user: user.email,
        tstamp: serverTimestamp(),
      },
    },
    onError
  );

const gapTime = 5 * 60_000; // ten minutes

const toTime = (tstamp) => {
  const d = new Date(tstamp);
  const h = d.getHours();
  return `${h % 12}:${d.getMinutes()}${h >= 12 ? 'p' : 'a'}`;
};

const getDate = (tstamp) => new Date(tstamp).toLocaleDateString();

export const Chat = ({onError, user, userIndex}) => {
  const [messages, setMessages] = useState({});
  const [msg, setMsg] = useStatePersist('chatMsg', '');
  const scrollBoxRef = useRef();
  const inputRef = useRef();

  useEffect(
    () =>
      listenToMessages((newMessages) => {
        setMessages(newMessages);
        setTimeout(() => {
          if (scrollBoxRef.current) {
            scrollBoxRef.current.scrollTop = scrollBoxRef.current.scrollHeight;
          }
        }, 1);
      }, onError),
    []
  );

  const groups = groupBy(({tstamp}) => getDate(tstamp), objToArr(messages));

  return (
    <div
      ref={scrollBoxRef}
      className="chat"
      onClick={() => inputRef.current.focus()}
    >
      {Object.entries(groups).map(([date, messages]) => (
        <div key={date}>
          <div className="date tstamp">{date}</div>
          {messages.map(({key, message, user, tstamp}, i, arr) => (
            <div
              className={
                'message' +
                (i && tstamp - arr[i - 1].tstamp > gapTime ? ' gap' : '')
              }
              key={key}
            >
              <span className="user">{userIndex[user]?.name || user}:</span>
              {message}
              <span className="tstamp">{toTime(tstamp)}</span>
            </div>
          ))}
        </div>
      ))}
      <textarea
        ref={inputRef}
        placeholder="Type here and press enter to chat..."
        value={msg}
        onChange={(e) => setMsg(e.target.value.replace(/^\s+/, ''))}
        onKeyUp={(e) => {
          if (e.key === 'Enter' && msg) {
            sendMessage(msg, user, onError);
            setMsg('');
          }
        }}
      />
    </div>
  );
};
