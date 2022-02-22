export function App(props) {
  return (
    <>
      <div className='content'>
        <h1>jefvel</h1>
        <p className='links'>
          <a
            class='link'
            href='//jefvel.newgrounds.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            newgrounds
          </a>
          <a
            class='link'
            href='//twitter.com/jefvel'
            target='_blank'
            rel='noopener noreferrer'
          >
            twitter
          </a>
          <a
            class='link'
            href='//github.com/jefvel'
            target='_blank'
            rel='noopener noreferrer'
          >
            github
          </a>
        </p>
      </div>
      <div class="corner bottomRight" />
      <div class="corner bottomLeft" />
      <div class="corner topRight" />
    </>
  );
}
