import { createContext, useContext, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkHeadingId from 'remark-heading-id';
import contentUrl from './content.md';
import './App.css';

const CommentContext = createContext(null);

function Comment({ type, sourcePosition, ...props }) {
  const context = useContext(CommentContext);
  const Type = type;

  const [hover, setHover] = useState(false);
  const handleMouseEnter = () => {
    setHover(true);
  };
  const handleMouseLeave = () => {
    setHover(false);
  };

  const comments = context?.comments?.[sourcePosition.start.line] || [];

  const [input, setInput] = useState('');
  const handleSubmitClick = () => {
    if (input) {
      context.updateComments({
        ...context.comments,
        [sourcePosition.start.line]: [...comments, input],
      });
      setInput('');
    }
  };

  return (
    <div
      className={type}
      style={{ position: 'relative', padding: 1, zIndex: hover ? 1000 : 0 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Type
        {...props}
        style={{ width: '65%', backgroundColor: hover ? '#dde4a3' : 'transparent', boxSizing: 'border-box' }}
      />

      <div style={{ position: 'absolute', top: 0, right: 20, width: '30%', padding: '6px 20px', background: 'white', border: `1px solid ${hover ? '#dedede' : 'transparent'}`, }}>
        {comments[0] && (
          <div className="flex vertical-center comment">
            <div className="avatar" />
            <div className="username">User:</div>
            <div className="comment-text">{comments[0]}</div>
          </div>
        )}

        {hover ? (
          <>
            {comments.slice(1).map(x => (
              <div key={x} className="flex vertical-center comment">
                <div className="avatar" />
                <div className="username">User:</div>
                <div className="comment-text">{x}</div>
              </div>
            ))}

            <div className="flex vertical-center">
              <div className="avatar" />
              <div className="username">Me:</div>
              <input value={input} onChange={e => setInput(e.target.value)} />
              <button onClick={handleSubmitClick}>Submit</button>
            </div>
          </>
        ) : comments.length > 1 && (
          <div>+{comments.length - 1}</div>
        )}
      </div>
    </div>
  )
}

function MarkdownComponent(type, { sourcePosition, ...props }) {
  if (sourcePosition.start.column === 1) {
    return (
      <Comment
        type={type}
        sourcePosition={sourcePosition}
        {...props}
      />
    );
  } else {
    const Type = type;
    return (
      <Type {...props} />
    );
  }
}

const Components = {
  p: MarkdownComponent.bind(undefined, 'p'),
  h2: MarkdownComponent.bind(undefined, 'h2'),
  h3: MarkdownComponent.bind(undefined, 'h3'),
  blockquote: MarkdownComponent.bind(undefined, 'blockquote'),
  li: MarkdownComponent.bind(undefined, 'li'),
}

function App() {
  const [content, setContent] = useState('');
  const [comments, setComments] = useState(JSON.parse(window.localStorage.getItem('comments') || '{}'));

  const updateComments = (comments) => {
    localStorage.setItem('comments', JSON.stringify(comments));
    setComments(comments);
  };

  useEffect(() => {
    fetch(contentUrl)
      .then(response => response.text())
      .then(text => setContent(text));
  }, []);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <CommentContext.Provider value={{ comments, updateComments }}>
        <ReactMarkdown
          rawSourcePos
          includeElementIndex
          remarkPlugins={[remarkGfm, remarkFrontmatter, remarkHeadingId]}
          rehypePlugins={[rehypeRaw]}
          components={Components}
          children={content}
        />
      </CommentContext.Provider>
    </div>
  );
}

export default App
