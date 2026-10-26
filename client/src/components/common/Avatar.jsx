import { fileUrl, initials } from "../../utils/format";

export default function Avatar({ employee, size = 36 }) {
  const src = fileUrl(employee?.avatar);
  return src ? (
    <img className="avatar" src={src} alt="" width={size} height={size} />
  ) : (
    <span className="avatar avatar-initials" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(employee)}
    </span>
  );
}
