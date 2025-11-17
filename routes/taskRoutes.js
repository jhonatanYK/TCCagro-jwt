const { Router } = require("express");
const {
  renderList,
  renderNew,
  create,
  renderEdit,
  edit,
  complete,
  remove,
} = require("../controllers/taskController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const router = Router();

router.get("/", authMiddleware, renderList);
router.get("/new", authMiddleware, renderNew);
router.post("/new", authMiddleware, create);
router.get("/edit/:id", authMiddleware, renderEdit);
router.post("/edit/:id", authMiddleware, edit);
router.post("/complete/:id", authMiddleware, complete);
router.post("/delete/:id", authMiddleware, remove);

module.exports = router;
