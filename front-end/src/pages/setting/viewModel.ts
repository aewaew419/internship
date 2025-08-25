import { useState, useEffect } from "react";
import { CourseService } from "../../service/api/course";
import type {
  CourseDTO,
  CourseSectionInterface,
  CourseInterface,
  CourseInstructor,
  CourseCommittee,
} from "../../service/api/course/type";
const useViewModel = () => {
  const courseService = new CourseService();
  const [courseSections, setCourseSections] = useState<
    CourseSectionInterface<CourseInterface>[]
  >([]);
  const [course, setCourse] = useState<CourseInterface[]>([]);
  const [courseInstructor, setCourseInstructor] = useState<CourseInstructor[]>(
    []
  );
  const [courseCommittee, setCourseCommittee] = useState<CourseCommittee[]>([]);

  const fetchCourse = async () => {
    await courseService
      .reqGetCourses()
      .then((response) => {
        setCourse(response);
      })
      .catch((error) => {
        console.error("Error fetching course sections:", error);
      });
  };
  const fetchCourseSection = async () => {
    await courseService
      .reqGetCourseSections()
      .then((response) => {
        setCourseSections(response);
      })
      .catch((error) => {
        console.error("Error fetching course sections:", error);
      });
  };
  const fetchCourseInstructor = async () => {
    await courseService
      .reqGetCourseInstructor()
      .then((response) => {
        setCourseInstructor(response);
      })
      .catch((error) => {
        console.error("Error fetching course sections:", error);
      });
  };
  const fetchCourseCommittee = async () => {
    await courseService
      .reqGetCourseCommittee()
      .then((response) => {
        setCourseCommittee(response);
      })
      .catch((error) => {
        console.error("Error fetching course sections:", error);
      });
  };
  const handleCreateCourseSection = async (entity: CourseDTO) => {
    await courseService
      .reqPostCourseSections(entity)
      .then(() => {
        fetchCourseSection();
      })
      .catch((error) => {
        console.error("Error creating course section:", error);
      });
  };
  const handleDeletedCourseSection = async (id: number) => {
    await courseService
      .reqDeleteCourseSections(id)
      .then(() => {
        fetchCourseSection();
      })
      .catch((error) => {
        console.error("Error deleting course section:", error);
      });
  };

  useEffect(() => {
    fetchCourseSection();
    fetchCourse();
    fetchCourseInstructor();
    fetchCourseCommittee();
  }, []);
  return {
    course,
    courseSections,
    courseInstructor,
    courseCommittee,
    handleCreateCourseSection,
    handleDeletedCourseSection,
  };
};

export default useViewModel;
