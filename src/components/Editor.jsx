import ReactQuill from "react-quill";

export default function Editor({value,onChange}) {
  const modules = {
    toolbar: [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction

  [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  ['link', 'image', 'video'],
  [{ 'align': [] }],

  ['clean']                                         // remove formatting button
]
  };
  const quillstyles ={
    color:""

  }
  return (
    <div className="">
    <ReactQuill
    style={quillstyles}
      value={value}
      theme={'snow'}
      onChange={onChange}
      modules={modules} 
      />
    </div>
  );
}