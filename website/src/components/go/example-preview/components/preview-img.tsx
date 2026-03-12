
import { isVideo } from '../utils/example-data';

export const PreviewImg = ({
  show,
  previewImage,
}: {
  show: boolean;
  previewImage: string;
}) => {
  return (
    <div
      style={{
        minHeight: '0px',
        display: show ? 'flex' : 'none',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isVideo(previewImage) ? (
        <video
          muted
          loop
          playsInline
          autoPlay
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        >
          <source src={previewImage} />
        </video>
      ) : (
        <img
          src={previewImage}
          alt=""
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  );
};
