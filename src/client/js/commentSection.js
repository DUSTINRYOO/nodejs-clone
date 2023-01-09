const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");

const addComment = (text, id, owner, time) => {
  const videoComments = document.querySelector(".video__comments__list ul");
  const newComment = document.createElement("li");
  const newCommentBox = document.createElement("div");
  const firstSpan = document.createElement("span");
  const secondSpan = document.createElement("span");
  const smallInBox = document.createElement("small");
  const aInBox = document.createElement("a");
  videoComments.prepend(newComment);
  newComment.appendChild(newCommentBox);
  newCommentBox.prepend(aInBox);
  newCommentBox.prepend(smallInBox);
  newCommentBox.prepend(secondSpan);
  newCommentBox.prepend(firstSpan);
  newComment.dataset.id = id;
  firstSpan.innerText = `${owner}`;
  secondSpan.innerText = `${text}`;
  smallInBox.innerText = `${time}`;
  aInBox.setAttribute("href", `${newComment.dataset.id}/comment/delete`);
  aInBox.innerText = "X";
  newComment.classList.add("comment");
  smallInBox.classList.add("createdAtComment");
  aInBox.classList.add("deleteComment");
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.videoid;
  if (text === "") {
    return;
  }
  const response = await fetch(`/api/video/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  textarea.value = "";
  const { newCommentId, newCommentOwner, newCommentCreatedAt } =
    await response.json();
  if (response.status == 201) {
    addComment(text, newCommentId, newCommentOwner, newCommentCreatedAt);
  }
};
if (form) {
  form.addEventListener("submit", handleSubmit);
}
