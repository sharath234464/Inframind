class ClassificationHelper:

    # ============================================================
    # ALLOCATION STATUS
    # ============================================================

    def get_allocation_status(
        self,
        actual: dict,
        golden: dict
    ) -> str:

        actual_vcpu = float(actual["vcpu"])
        actual_memory = float(actual["memory"])
        actual_disk = float(actual["disk"])

        golden_vcpu = float(golden["vcpu"])
        golden_memory = float(golden["memory"])
        golden_disk = float(golden["disk"])

        # Exactly matching Golden Configuration
        if (
            actual_vcpu == golden_vcpu
            and actual_memory == golden_memory
            and actual_disk == golden_disk
        ):
            return "Properly Allocated"

        # Server has equal or more resources than required
        if (
            actual_vcpu >= golden_vcpu
            and actual_memory >= golden_memory
            and actual_disk >= golden_disk
        ):
            return "Over Allocated"

        # Otherwise resources are below Golden Configuration
        return "Under Allocated"

    # ============================================================
    # UTILIZATION STATUS
    # ============================================================

    def get_utilization_status(
        self,
        actual: dict,
        golden: dict
    ) -> str:

        cpu = float(actual["cpu_utilization"])
        memory = float(actual["memory_utilization"])

        cpu_min = float(
            golden["target_cpu_utilization_min"]
        )

        cpu_max = float(
            golden["target_cpu_utilization_max"]
        )

        memory_min = float(
            golden["target_memory_utilization_min"]
        )

        memory_max = float(
            golden["target_memory_utilization_max"]
        )

        # Both CPU and Memory are below target
        if (
            cpu < cpu_min
            and memory < memory_min
        ):
            return "Under Utilized"

        # Either CPU or Memory exceeds target
        if (
            cpu > cpu_max
            or memory > memory_max
        ):
            return "Over Utilized"

        return "Properly Utilized"

    # ============================================================
    # FINAL CLASSIFICATION
    # 3 Allocation states × 3 Utilization states
    # ============================================================

    def get_classification(
        self,
        allocation: str,
        utilization: str
    ) -> str:

        # --------------------------------------------------------
        # Properly Allocated
        # --------------------------------------------------------

        if allocation == "Properly Allocated":

            if utilization == "Properly Utilized":
                return "Compliant"

            if utilization == "Under Utilized":
                return "Properly Allocated & Under Utilized"

            if utilization == "Over Utilized":
                return "Properly Allocated & Over Utilized"

        # --------------------------------------------------------
        # Over Allocated
        # --------------------------------------------------------

        if allocation == "Over Allocated":

            if utilization == "Under Utilized":
                return "Over Allocated & Under Utilized"

            if utilization == "Properly Utilized":
                return "Over Allocated & Properly Utilized"

            if utilization == "Over Utilized":
                return "Over Allocated & Over Utilized"

        # --------------------------------------------------------
        # Under Allocated
        # --------------------------------------------------------

        if allocation == "Under Allocated":

            if utilization == "Under Utilized":
                return "Under Allocated & Under Utilized"

            if utilization == "Properly Utilized":
                return "Under Allocated & Properly Utilized"

            if utilization == "Over Utilized":
                return "Under Allocated & Over Utilized"

        return "Unknown"


classification_helper = ClassificationHelper()